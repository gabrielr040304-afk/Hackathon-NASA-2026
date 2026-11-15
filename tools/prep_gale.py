"""Crop the public HiRISE PDS3 DTM to the two prepared Curiosity routes.
Standard library only; range requests cache source bytes under tools/cache.
No synthetic elevation or void filling is allowed.
"""
import json, math, re, struct, urllib.request
from pathlib import Path
from array import array

ROOT = Path(__file__).resolve().parent.parent
URL = 'https://www.uahirise.org/PDS/DTM/ESP/ORB_019600_019699/ESP_019698_1750_ESP_019988_1750/DTEEC_019698_1750_019988_1750_U01.IMG'
LAT, LON, EXTENT, SIZE = -4.8052, 137.3800, 1600.0, 512

def fetch(start, count):
    request = urllib.request.Request(URL, headers={'Range': f'bytes={start}-{start+count-1}'})
    with urllib.request.urlopen(request, timeout=60) as response:
        if response.status != 206:
            raise ValueError('Server did not honor partial download')
        data = response.read()
    if len(data) != count:
        raise ValueError('Incomplete range response')
    return data

def main():
    cache = ROOT / 'tools/cache'; cache.mkdir(exist_ok=True)
    header = fetch(0, 16384).decode('ascii', errors='replace')
    (cache / 'gale-dtm-label.txt').write_text(header, encoding='utf-8')
    def number(key):
        return float(re.search(r'^\s*'+re.escape(key)+r'\s*=\s*([-\d.E+]+)', header, re.M).group(1))
    assert 'PC_REAL' in header and number('SAMPLE_BITS') == 32
    radius = number('A_AXIS_RADIUS') * 1000
    scale = number('MAP_SCALE'); lon0 = number('CENTER_LONGITUDE')
    width, height = int(number('LINE_SAMPLES')), int(number('LINES'))
    record = int(number('RECORD_BYTES')); offset = (int(number('^IMAGE'))-1)*record
    line_offset, sample_offset = number('LINE_PROJECTION_OFFSET'), number('SAMPLE_PROJECTION_OFFSET')
    def pixel(lat, lon):
        return (sample_offset + radius*math.radians(lon-lon0)/scale,
                line_offset - radius*math.radians(lat)/scale)
    project_radius = 3396190
    dlat = math.degrees(EXTENT/2/project_radius)
    dlon = dlat/math.cos(math.radians(LAT))
    bbox = [LON-dlon, LAT-dlat, LON+dlon, LAT+dlat]
    c0, r0 = pixel(bbox[3], bbox[0]); c1, r1 = pixel(bbox[1], bbox[2])
    first, last = math.floor(r0), math.ceil(r1)+1
    assert 0 <= c0 < c1 < width-1 and 0 <= first < last < height
    cache_file = cache / f'gale-dtm-rows-{first}-{last}.bin'
    count = (last-first+1)*record
    if not cache_file.exists():
        cache_file.write_bytes(fetch(offset+first*record,count))
    raw = cache_file.read_bytes(); assert len(raw) == count
    def value(row, col):
        v = struct.unpack_from('<f',raw,((row-first)*width+col)*4)[0]
        if not math.isfinite(v) or not -10000 < v < 10000:
            raise ValueError(f'No elevation coverage at row {row}, col {col}')
        return v
    elevations = []
    for i in range(SIZE):
        for j in range(SIZE):
            col, row = c0+(c1-c0)*j/(SIZE-1), r0+(r1-r0)*i/(SIZE-1)
            a,b = math.floor(col), math.floor(row); u,v=col-a,row-b
            elevations.append((value(b,a)*(1-u)+value(b,a+1)*u)*(1-v)+(value(b+1,a)*(1-u)+value(b+1,a+1)*u)*v)
    out=ROOT/'data/gale';out.mkdir(exist_ok=True)
    (out/'terrain.bin').write_bytes(struct.pack('<'+str(len(elevations))+'f',*elevations))
    meta=dict(width=SIZE,height=SIZE,m_per_px_x=EXTENT/(SIZE-1),m_per_px_y=EXTENT/(SIZE-1),center_lat=LAT,center_lon=LON,bbox=bbox,elev_min=min(elevations),elev_max=max(elevations),source='HiRISE DTEEC_019698_1750_019988_1750_U01; bilinear resampling [D]',source_url=URL,source_resolution_m=scale,source_radius_m=radius,source_projection='Equirectangular, planetocentric, east-positive; PDS projection offsets',void_count=0)
    (out/'terrain.json').write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(meta,indent=2))

if __name__ == '__main__': main()
