// Todas as constantes do modelo. Etiqueta: [R] real · [D] derivado · [S] simulado (suposição nossa).
export const MARS_RADIUS_M = 3396190;        // [R] esfera IAU Mars 2000 (mesma do relevo HiRISE)
export const SUIT_CAPACITY_H = 8;            // [S] ordem de grandeza das EVAs da NASA
export const RESERVE_PCT = 30;               // [S] reserva mínima ao voltar
export const SUIT_SPEED_FACTOR = 0.5;        // [S] traje reduz a velocidade a pé pela metade
export const LOAD_FACTOR_PER_KG = 0.01;      // [S] +1% de esforço por kg carregado
export const SLOPE_FACTOR_PER_DEG = 0.03;    // [S] +3% de esforço por grau de subida
export const ROVER_KMH = 8;                  // [S] inspirado no rover lunar da Apollo
export const ROVER_MAX_SLOPE_DEG = 15;       // [S]
export const SLOPE_WARN_DEG = 15;            // [S]
export const SLOPE_NOGO_DEG = 25;            // [S]
export const SCIENCE_MIN_PER_TARGET = 30;    // [S]
export const RAD_MSV_PER_DAY = 0.64;         // [R] Curiosity RAD em Gale (Hassler et al., Science 343, 2014)
export const CAREER_LIMIT_MSV = 600;         // [R] NASA-STD-3001
export const DAYLIGHT_MARGIN_MIN = 60;       // [S] voltar 1 h antes do pôr do sol
export const SUIT_PRESSURE_KPA = 29.6;       // [R] traje EMU da NASA (4,3 psi)
export const HR_BASE_BPM = 75;               // [S]
export const HR_PER_EFFORT = 45;             // [S]
export const TIME_SCALE = 30;                // demonstração: 1 s real = 30 s simulados (ajustável)
export const ARRIVAL_RADIUS_M = 15;
export const PEAK_TEMP_HOUR = 14;            // [S] hora da temperatura máxima do dia
