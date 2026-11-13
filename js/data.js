/* EsgotoZero · dados de referência e exemplos fictícios.
   Tudo o que é "relato" aqui é inventado para demonstração. Os números de ODS 6 são reais (fontes no fim). */
'use strict';
window.EZ = window.EZ || {};

/* ---------- Andamento de um relato ---------- */
EZ.STATUS = {
  recebido:    { label: 'Recebido',    icon: 'Inbox',      desc: 'Chegou à equipe e aguarda triagem.' },
  triagem:     { label: 'Em triagem',  icon: 'ScanSearch', desc: 'A equipe está conferindo local, fotos e informações.' },
  encaminhado: { label: 'Encaminhado', icon: 'Send',       desc: 'Enviado ao órgão responsável, com protocolo.' },
  encerrado:   { label: 'Encerrado',   icon: 'CircleCheck', desc: 'Acompanhamento concluído, com motivo registrado.' }
};
EZ.STATUS_ORDER = ['recebido', 'triagem', 'encaminhado', 'encerrado'];

/* ---------- O que a pessoa observou ---------- */
EZ.CATEGORIES = [
  { key: 'despejo',    label: 'Possível despejo de esgoto',  short: 'Despejo',        icon: 'Droplets',   hint: 'Líquido saindo de tubo ou galeria direto na água' },
  { key: 'rede',       label: 'Vazamento na rede de esgoto', short: 'Rede de esgoto', icon: 'CircleDot',  hint: 'Bueiro ou poço de visita transbordando' },
  { key: 'aspecto',    label: 'Água com cor, espuma ou odor', short: 'Aspecto da água', icon: 'Waves',    hint: 'Mudança visível na água ou cheiro forte' },
  { key: 'residuos',   label: 'Lixo e resíduos na água',     short: 'Resíduos',       icon: 'Trash2',     hint: 'Material acumulado na margem ou flutuando' },
  { key: 'mortandade', label: 'Peixes ou animais mortos',    short: 'Mortandade',     icon: 'Fish',       hint: 'Animais aquáticos mortos na água ou na margem' },
  { key: 'outro',      label: 'Outro sinal',                 short: 'Outro',          icon: 'CircleHelp', hint: 'Algo diferente que merece atenção' }
];
EZ.CATEGORY = Object.fromEntries(EZ.CATEGORIES.map(c => [c.key, c]));

EZ.SIGNS = [
  { key: 'odor',       label: 'Odor forte',        icon: 'Wind' },
  { key: 'espuma',     label: 'Espuma',            icon: 'Sparkles' },
  { key: 'cor',        label: 'Cor alterada',      icon: 'Palette' },
  { key: 'oleo',       label: 'Mancha de óleo',    icon: 'Droplet' },
  { key: 'tubulacao',  label: 'Saída de tubulação', icon: 'Waypoints' },
  { key: 'transbordo', label: 'Transbordamento',   icon: 'CircleDot' },
  { key: 'lixo',       label: 'Lixo acumulado',    icon: 'Trash2' },
  { key: 'peixes',     label: 'Peixes mortos',     icon: 'Fish' }
];
EZ.SIGN = Object.fromEntries(EZ.SIGNS.map(s => [s.key, s]));

EZ.SEVERITY = {
  baixa: { label: 'Leve',     weight: 1, desc: 'Sinal pequeno ou pontual' },
  media: { label: 'Moderado', weight: 2, desc: 'Visível e persistente' },
  alta:  { label: 'Grave',    weight: 3, desc: 'Grande volume, odor intenso ou risco à saúde' }
};

EZ.WATER = [
  { key: 'rio', label: 'Rio' }, { key: 'corrego', label: 'Córrego ou igarapé' }, { key: 'canal', label: 'Canal' },
  { key: 'praia', label: 'Praia ou mar' }, { key: 'lagoa', label: 'Lagoa ou represa' }, { key: 'mangue', label: 'Mangue ou estuário' },
  { key: 'rua', label: 'Rua ou bueiro' }, { key: 'outro', label: 'Outro' }
];
EZ.WATER_LABEL = Object.fromEntries(EZ.WATER.map(w => [w.key, w.label]));

EZ.CLOSE_REASONS = [
  { key: 'resolvido',     label: 'Órgão informou a solução' },
  { key: 'duplicado',     label: 'Relato duplicado' },
  { key: 'sem-elementos', label: 'Sem elementos para acompanhar' },
  { key: 'fora-escopo',   label: 'Fora do escopo do projeto' },
  { key: 'outro',         label: 'Outro motivo' }
];
EZ.AGENCIES = [
  'Companhia de saneamento do município',
  'Órgão ambiental estadual',
  'Prefeitura · ouvidoria ou zeladoria',
  'Vigilância em saúde',
  'Ministério Público · meio ambiente'
];

/* ---------- Brasil: regiões e estados (centro aproximado e capital) ---------- */
EZ.REGIONS = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
EZ.UFS = {
  AC: { name: 'Acre', region: 'Norte', lat: -8.77, lng: -70.55, z: 7 },
  AL: { name: 'Alagoas', region: 'Nordeste', lat: -9.62, lng: -36.82, z: 8 },
  AM: { name: 'Amazonas', region: 'Norte', lat: -3.47, lng: -65.1, z: 5 },
  AP: { name: 'Amapá', region: 'Norte', lat: 1.41, lng: -51.77, z: 7 },
  BA: { name: 'Bahia', region: 'Nordeste', lat: -13.29, lng: -41.71, z: 6 },
  CE: { name: 'Ceará', region: 'Nordeste', lat: -5.2, lng: -39.53, z: 7 },
  DF: { name: 'Distrito Federal', region: 'Centro-Oeste', lat: -15.83, lng: -47.86, z: 9 },
  ES: { name: 'Espírito Santo', region: 'Sudeste', lat: -19.19, lng: -40.34, z: 7 },
  GO: { name: 'Goiás', region: 'Centro-Oeste', lat: -15.98, lng: -49.86, z: 6 },
  MA: { name: 'Maranhão', region: 'Nordeste', lat: -5.42, lng: -45.44, z: 6 },
  MG: { name: 'Minas Gerais', region: 'Sudeste', lat: -18.1, lng: -44.38, z: 6 },
  MS: { name: 'Mato Grosso do Sul', region: 'Centro-Oeste', lat: -20.51, lng: -54.54, z: 6 },
  MT: { name: 'Mato Grosso', region: 'Centro-Oeste', lat: -12.64, lng: -55.42, z: 5 },
  PA: { name: 'Pará', region: 'Norte', lat: -3.79, lng: -52.48, z: 5 },
  PB: { name: 'Paraíba', region: 'Nordeste', lat: -7.28, lng: -36.72, z: 8 },
  PE: { name: 'Pernambuco', region: 'Nordeste', lat: -8.38, lng: -37.86, z: 7 },
  PI: { name: 'Piauí', region: 'Nordeste', lat: -6.6, lng: -42.28, z: 6 },
  PR: { name: 'Paraná', region: 'Sul', lat: -24.89, lng: -51.55, z: 7 },
  RJ: { name: 'Rio de Janeiro', region: 'Sudeste', lat: -22.25, lng: -42.66, z: 8 },
  RN: { name: 'Rio Grande do Norte', region: 'Nordeste', lat: -5.81, lng: -36.59, z: 8 },
  RO: { name: 'Rondônia', region: 'Norte', lat: -10.83, lng: -63.34, z: 6 },
  RR: { name: 'Roraima', region: 'Norte', lat: 1.99, lng: -61.33, z: 6 },
  RS: { name: 'Rio Grande do Sul', region: 'Sul', lat: -30.17, lng: -53.5, z: 6 },
  SC: { name: 'Santa Catarina', region: 'Sul', lat: -27.45, lng: -50.95, z: 7 },
  SE: { name: 'Sergipe', region: 'Nordeste', lat: -10.57, lng: -37.45, z: 8 },
  SP: { name: 'São Paulo', region: 'Sudeste', lat: -22.19, lng: -48.79, z: 6 },
  TO: { name: 'Tocantins', region: 'Norte', lat: -9.46, lng: -48.26, z: 6 }
};
EZ.BRAZIL_BOUNDS = [[-33.9, -73.9], [5.4, -34.7]];

/* ---------- ODS 6 no Brasil (dados reais) ----------
   SINISA 2024, divulgados pelo Instituto Trata Brasil (Ranking do Saneamento 2026, mar/2026,
   e levantamento regional de 12/05/2026). Meta: Marco Legal do Saneamento (Lei 14.026/2020). */
EZ.ODS = {
  year: 2024,
  national: { agua: 84.1, coleta: 56.7, tratamento: 51.8, semColetaMi: 90, semColetaPct: 43.3 },
  target: { ano: 2033, agua: 99, esgoto: 90 },
  regions: [
    { name: 'Sudeste',      coleta: 80.8, tratamento: 62.3 },
    { name: 'Centro-Oeste', coleta: 64.2, tratamento: 54.7 },
    { name: 'Sul',          coleta: 49.6, tratamento: 46.6 },
    { name: 'Nordeste',     coleta: 31.7, tratamento: 34.6 },
    { name: 'Norte',        coleta: 16.6, tratamento: 22.5 }
  ],
  nordesteSemColetaMi: 36,
  sources: [
    { label: 'Instituto Trata Brasil · Ranking do Saneamento 2026 (SINISA 2024)', url: 'https://tratabrasil.org.br/ranking-do-saneamento-2026/' },
    { label: 'Instituto Trata Brasil · quase 90 milhões sem coleta de esgoto (maio/2026)', url: 'https://tratabrasil.org.br/90-milhoes-brasileiros-nao-tem-coleta-esgoto/' },
    { label: 'Nações Unidas no Brasil · ODS 6', url: 'https://brasil.un.org/pt-br/sdgs/6' },
    { label: 'Ipea · metas do ODS 6 adaptadas ao Brasil', url: 'https://www.ipea.gov.br/ods/ods6.html' },
    { label: 'SEMIL-SP · como denunciar (Disque Ambiente da CETESB, 0800 500 1350)', url: 'https://semil.sp.gov.br/educacaoambiental/?p=19051' },
    { label: 'Ibama · canais de denúncia (Linha Verde)', url: 'https://www.gov.br/ibama/pt-br/assuntos/fiscalizacao-e-protecao-ambiental/fiscalizacao-ambiental/denuncias' }
  ]
};

/* Fotos ilustrativas (recortes de duas fotografias com licença livre; não mostram os locais dos relatos). */
EZ.PHOTOS = {
  'rio-1': 'assets/img/foto-rio-1.jpg', 'rio-2': 'assets/img/foto-rio-2.jpg', 'rio-3': 'assets/img/foto-rio-3.jpg', 'rio-4': 'assets/img/foto-rio-4.jpg',
  'costa-1': 'assets/img/foto-costa-1.jpg', 'costa-2': 'assets/img/foto-costa-2.jpg', 'costa-3': 'assets/img/foto-costa-3.jpg', 'costa-4': 'assets/img/foto-costa-4.jpg'
};

/* ---------- Relatos fictícios espalhados pelo Brasil ----------
   [título, categoria, sinais, gravidade, tipo de água, nome da água, referência, cidade, UF, lat, lng,
    andamento, publicado, dias atrás, confirmações, foto, autor, acontecendo agora] */
EZ.SEED_ROWS = [
  ['Líquido escuro saindo de tubulação no canal', 'despejo', ['tubulacao', 'odor', 'cor'], 'alta', 'canal', 'Canal 1', 'Av. Pinheiro Machado, perto da ponte do Marapé', 'Santos', 'SP', -23.9515, -46.3503, 'triagem', true, 2, 14, 'costa-1', 'me', true],
  ['Espuma branca acumulada perto da ponte', 'aspecto', ['espuma', 'odor'], 'media', 'rio', 'Rio Tietê', 'Marginal, próximo à Ponte das Bandeiras', 'São Paulo', 'SP', -23.5176, -46.6262, 'encaminhado', true, 19, 41, 'rio-4', 'me', false],
  ['Mancha de óleo junto à margem', 'aspecto', ['oleo', 'cor'], 'media', 'rio', 'Rio Pinheiros', 'Ciclovia, perto da Ponte Cidade Universitária', 'São Paulo', 'SP', -23.5664, -46.7086, 'recebido', false, 0, 0, null, 'me', true],
  ['Observação junto à tubulação na margem', 'despejo', ['tubulacao'], 'media', 'rio', 'Rio Cubatão', 'Margem próxima à ponte da Av. Nove de Abril', 'Cubatão', 'SP', -23.8880, -46.4290, 'encerrado', true, 58, 9, 'costa-2', 'me', false],
  ['Água escura na saída de galeria', 'despejo', ['cor', 'odor'], 'baixa', 'mangue', 'Estuário de Santos', 'Orla de Vicente de Carvalho', 'Guarujá', 'SP', -23.9536, -46.2997, 'recebido', false, 1, 0, null, 'me', false],
  ['Resíduos acumulados após a chuva', 'residuos', ['lixo'], 'media', 'canal', 'Canal dos Barreiros', 'Sob a Ponte dos Barreiros', 'São Vicente', 'SP', -23.9612, -46.4090, 'triagem', true, 6, 7, 'costa-3', 'x', false],
  ['Saída de líquido com odor na margem', 'despejo', ['tubulacao', 'odor'], 'media', 'rio', 'Rio Boturoca', 'Estrada do Boturoca, trecho da ponte', 'Praia Grande', 'SP', -24.0120, -46.4880, 'encaminhado', true, 27, 12, 'costa-4', 'x', false],
  ['Espuma e cheiro forte no canal', 'aspecto', ['espuma', 'odor'], 'alta', 'canal', 'Canal do Mangue', 'Av. Francisco Bicalho, perto da Leopoldina', 'Rio de Janeiro', 'RJ', -22.9115, -43.2050, 'encaminhado', true, 23, 38, 'rio-2', 'x', false],
  ['Lixo flutuando na areia e na água', 'residuos', ['lixo', 'cor'], 'media', 'praia', 'Baía de Guanabara', 'Praia de Ramos', 'Rio de Janeiro', 'RJ', -22.8446, -43.2528, 'triagem', true, 4, 16, 'costa-3', 'x', false],
  ['Peixes mortos na margem da lagoa', 'mortandade', ['peixes', 'odor'], 'alta', 'lagoa', 'Lagoa Rodrigo de Freitas', 'Margem perto do Parque dos Patins', 'Rio de Janeiro', 'RJ', -22.9722, -43.2128, 'encerrado', true, 71, 52, 'rio-3', 'x', false],
  ['Bueiro transbordando para o ribeirão', 'rede', ['transbordo', 'odor'], 'media', 'rio', 'Ribeirão Arrudas', 'Av. dos Andradas, altura da Santa Efigênia', 'Belo Horizonte', 'MG', -19.9195, -43.9290, 'encaminhado', true, 15, 11, null, 'x', false],
  ['Água esverdeada e turva na orla', 'aspecto', ['cor'], 'baixa', 'lagoa', 'Lagoa da Pampulha', 'Orla, próximo à Igreja São Francisco', 'Belo Horizonte', 'MG', -19.8580, -43.9780, 'encerrado', true, 64, 6, 'rio-1', 'x', false],
  ['Tubo despejando água cinza no canal', 'despejo', ['tubulacao', 'cor'], 'media', 'canal', 'Canal da Passagem', 'Ponte de Jardim da Penha', 'Vitória', 'ES', -20.2868, -40.2996, 'triagem', true, 9, 5, 'costa-1', 'x', false],
  ['Odor intenso no córrego à noite', 'aspecto', ['odor'], 'media', 'corrego', 'Ribeirão Anhumas', 'Parque Linear, trecho do Jardim Ipaussurama', 'Campinas', 'SP', -22.8672, -47.0476, 'recebido', false, 1, 0, null, 'x', true],
  ['Espuma na corredeira depois da barragem', 'aspecto', ['espuma'], 'baixa', 'rio', 'Rio Sorocaba', 'Parque das Águas', 'Sorocaba', 'SP', -23.4962, -47.4577, 'encerrado', true, 45, 4, 'rio-4', 'x', false],
  ['Lixo e óleo junto à ponte', 'residuos', ['lixo', 'oleo'], 'media', 'rio', 'Rio Paraibuna', 'Av. Brasil, perto da Ponte Vermelha', 'Juiz de Fora', 'MG', -21.7599, -43.3472, 'triagem', true, 12, 3, 'rio-2', 'x', false],
  ['Galeria despejando no arroio', 'despejo', ['tubulacao', 'odor', 'cor'], 'alta', 'corrego', 'Arroio Dilúvio', 'Av. Ipiranga, perto da PUCRS', 'Porto Alegre', 'RS', -30.0588, -51.1760, 'encaminhado', true, 21, 29, 'costa-4', 'x', false],
  ['Mancha escura na orla do Guaíba', 'aspecto', ['cor', 'odor'], 'media', 'lagoa', 'Lago Guaíba', 'Orla, próximo à Usina do Gasômetro', 'Porto Alegre', 'RS', -30.0345, -51.2418, 'encerrado', true, 52, 18, 'costa-3', 'x', false],
  ['Espuma e cheiro no rio canalizado', 'aspecto', ['espuma', 'odor'], 'media', 'rio', 'Rio Belém', 'Trecho aberto no Prado Velho', 'Curitiba', 'PR', -25.4520, -49.2560, 'triagem', true, 8, 9, 'rio-4', 'x', false],
  ['Água turva e esverdeada na lagoa', 'aspecto', ['cor'], 'media', 'lagoa', 'Lagoa da Conceição', 'Canal da Barra, próximo à ponte', 'Florianópolis', 'SC', -27.5996, -48.4648, 'encaminhado', true, 33, 22, 'rio-1', 'x', false],
  ['Resíduos presos na margem do rio', 'residuos', ['lixo'], 'baixa', 'rio', 'Rio Cachoeira', 'Av. Hermann August Lepper', 'Joinville', 'SC', -26.3040, -48.8420, 'encerrado', true, 40, 3, 'rio-2', 'x', false],
  ['Tubulação com efluente na margem', 'despejo', ['tubulacao', 'cor'], 'media', 'rio', 'Rio Itajaí-Açu', 'Beira-rio, perto da Prefeitura', 'Blumenau', 'SC', -26.9185, -49.0675, 'recebido', false, 2, 0, 'costa-1', 'x', false],
  ['Espuma e lixo perto da ponte', 'aspecto', ['espuma', 'lixo'], 'alta', 'rio', 'Rio Capibaribe', 'Ponte da Boa Vista', 'Recife', 'PE', -8.0616, -34.8812, 'encaminhado', true, 17, 35, 'rio-2', 'x', false],
  ['Galeria com esgoto na enseada', 'despejo', ['tubulacao', 'odor'], 'alta', 'praia', 'Baía de Todos-os-Santos', 'Enseada dos Tainheiros', 'Salvador', 'BA', -12.9270, -38.4960, 'triagem', true, 5, 13, 'costa-2', 'x', false],
  ['Água escura no rio do parque', 'aspecto', ['cor', 'odor'], 'media', 'rio', 'Rio Cocó', 'Parque do Cocó, perto da ponte da Av. Eng. Santana Jr.', 'Fortaleza', 'CE', -3.7475, -38.4880, 'encaminhado', true, 29, 17, 'rio-3', 'x', false],
  ['Lixo acumulado na foz do riacho', 'residuos', ['lixo', 'odor'], 'media', 'praia', 'Riacho Maceió', 'Foz, na Beira-Mar', 'Fortaleza', 'CE', -3.7248, -38.4969, 'encerrado', true, 66, 8, 'costa-3', 'x', false],
  ['Transbordamento de esgoto na rua', 'rede', ['transbordo', 'odor'], 'media', 'rua', 'Rio Anil', 'Rua próxima à Ponte do São Francisco', 'São Luís', 'MA', -2.5200, -44.2860, 'triagem', true, 3, 4, null, 'x', true],
  ['Espuma na margem do rio', 'aspecto', ['espuma'], 'baixa', 'rio', 'Rio Poti', 'Av. Marechal Castelo Branco', 'Teresina', 'PI', -5.0784, -42.7887, 'encerrado', true, 49, 2, 'rio-4', 'x', false],
  ['Mancha de óleo perto do cais', 'aspecto', ['oleo'], 'media', 'rio', 'Rio Potengi', 'Cais da Tavares de Lira', 'Natal', 'RN', -5.7666, -35.2105, 'encaminhado', true, 24, 9, 'costa-3', 'x', false],
  ['Saída de esgoto no manguezal', 'despejo', ['tubulacao', 'odor'], 'alta', 'mangue', 'Rio Jaguaribe', 'Trecho do bairro São José', 'João Pessoa', 'PB', -7.1265, -34.8470, 'recebido', false, 3, 0, 'costa-2', 'x', false],
  ['Peixes mortos na lagoa', 'mortandade', ['peixes', 'cor'], 'alta', 'lagoa', 'Lagoa Mundaú', 'Orla lagunar do Bom Parto', 'Maceió', 'AL', -9.6390, -35.7560, 'encaminhado', true, 11, 27, 'rio-3', 'x', false],
  ['Água com odor forte no estuário', 'aspecto', ['odor'], 'media', 'mangue', 'Rio Sergipe', 'Orla do bairro Industrial', 'Aracaju', 'SE', -10.9160, -37.0480, 'triagem', true, 10, 6, 'costa-4', 'x', false],
  ['Resíduos boiando na beira do rio', 'residuos', ['lixo'], 'baixa', 'rio', 'Rio São Francisco', 'Orla II, perto da ponte', 'Petrolina', 'PE', -9.3950, -40.5020, 'encerrado', true, 55, 5, 'rio-2', 'x', false],
  ['Cor alterada no açude do centro', 'aspecto', ['cor', 'espuma'], 'media', 'lagoa', 'Açude Velho', 'Margem perto do monumento', 'Campina Grande', 'PB', -7.2250, -35.8820, 'encaminhado', true, 31, 14, 'rio-1', 'x', false],
  ['Canal com lixo e odor forte', 'residuos', ['lixo', 'odor'], 'alta', 'canal', 'Canal da Doca', 'Av. Visconde de Souza Franco', 'Belém', 'PA', -1.4463, -48.4867, 'triagem', true, 7, 19, 'costa-3', 'x', false],
  ['Esgoto a céu aberto no igarapé', 'despejo', ['tubulacao', 'cor', 'odor'], 'alta', 'corrego', 'Igarapé do Educandos', 'Orla do bairro Educandos', 'Manaus', 'AM', -3.1405, -60.0100, 'encaminhado', true, 26, 33, 'rio-3', 'x', false],
  ['Mancha escura na margem do rio', 'aspecto', ['cor'], 'media', 'rio', 'Rio Madeira', 'Orla do Cai n’Água', 'Porto Velho', 'RO', -8.7585, -63.9085, 'recebido', false, 2, 0, null, 'x', false],
  ['Lixo acumulado no canal', 'residuos', ['lixo'], 'media', 'canal', 'Canal do Jandiá', 'Ponte da Av. Pedro Lazarino', 'Macapá', 'AP', -0.0150, -51.0580, 'triagem', true, 13, 5, null, 'x', false],
  ['Água barrenta com odor na orla', 'aspecto', ['cor', 'odor'], 'baixa', 'rio', 'Rio Tapajós', 'Orla, perto do mercado', 'Santarém', 'PA', -2.4175, -54.7120, 'encerrado', true, 61, 4, 'rio-1', 'x', false],
  ['Galeria despejando no igarapé', 'despejo', ['tubulacao'], 'media', 'corrego', 'Igarapé São Francisco', 'Trecho do Parque da Maternidade', 'Rio Branco', 'AC', -9.9630, -67.8200, 'encaminhado', true, 35, 7, 'costa-4', 'x', false],
  ['Espuma na orla do lago', 'aspecto', ['espuma'], 'baixa', 'lagoa', 'Lago de Palmas', 'Praia da Graciosa', 'Palmas', 'TO', -10.1845, -48.3690, 'encerrado', true, 47, 3, 'rio-4', 'x', false],
  ['Odor forte perto da ponte', 'aspecto', ['odor', 'cor'], 'media', 'lagoa', 'Lago Paranoá', 'Perto da Ponte JK', 'Brasília', 'DF', -15.8200, -47.8350, 'triagem', true, 9, 10, 'rio-1', 'x', false],
  ['Resíduos e espuma no córrego', 'residuos', ['lixo', 'espuma'], 'media', 'corrego', 'Córrego Botafogo', 'Marginal Botafogo, Setor Central', 'Goiânia', 'GO', -16.6840, -49.2500, 'encaminhado', true, 18, 12, 'rio-2', 'x', false],
  ['Saída de efluente no rio', 'despejo', ['tubulacao', 'cor'], 'alta', 'rio', 'Rio Cuiabá', 'Orla do Porto', 'Cuiabá', 'MT', -15.6130, -56.1050, 'recebido', false, 4, 0, 'costa-1', 'x', false],
  ['Bueiro transbordando para o córrego', 'rede', ['transbordo'], 'media', 'corrego', 'Córrego Segredo', 'Av. Ernesto Geisel', 'Campo Grande', 'MS', -20.4440, -54.6240, 'encerrado', true, 38, 6, null, 'x', false]
];

EZ.DESCRIPTIONS = {
  despejo: [
    'Vi um líquido escuro saindo de uma tubulação direto no {agua}. O fluxo era contínuo e havia cheiro forte no entorno.',
    'Há uma saída de galeria despejando água com cor diferente no {agua}. Voltei no dia seguinte e continuava igual.'
  ],
  rede: ['A tampa do bueiro está transbordando e o líquido escorre até o {agua}. O cheiro é forte e o problema aparece principalmente depois da chuva.'],
  aspecto: [
    'A água do {agua} está com aspecto diferente do normal, com espuma e cheiro forte perto da margem.',
    'Percebi uma mudança de cor na água do {agua}. A mancha ocupa um trecho grande perto da margem.'
  ],
  residuos: ['Muito lixo acumulado na margem do {agua}, com sacolas, garrafas e restos de material. Parte está sendo levada pela água.'],
  mortandade: ['Encontrei peixes mortos na margem do {agua}. A água estava escura e com odor. Não toquei em nada.'],
  outro: ['Observei algo diferente no {agua} que vale a pena a equipe conferir.']
};

/* Data (AAAA-MM-DD) no fuso do aparelho. Usar toISOString() daria o dia seguinte depois das 21h no Brasil. */
const localDay = iso => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/* Monta os relatos de exemplo com datas relativas a "agora". */
EZ.makeSeed = function makeSeed(now = Date.now()) {
  const H = 3600e3, D = 24 * H;
  const rows = [...EZ.SEED_ROWS].sort((a, b) => b[13] - a[13]); // do mais antigo ao mais novo
  return rows.map((r, i) => {
    const [title, category, signs, severity, water, waterName, place, city, uf, lat, lng, status, published, days, conf, photo, author, ongoing] = r;
    const id = 'EZ-' + String(1001 + i).padStart(4, '0');
    const jitter = ((i * 7919) % 17) * H * 0.6;
    const created = new Date(now - days * D - jitter - 2 * H).toISOString();
    const variants = EZ.DESCRIPTIONS[category] || EZ.DESCRIPTIONS.outro;
    const description = variants[i % variants.length].replace('{agua}', waterName);
    const clampNow = t => Math.min(t, now - 20 * 60e3);
    const t0 = Date.parse(created);
    const history = [{ status: 'recebido', title: 'Relato recebido', date: created, note: 'Registro criado pela comunidade no EsgotoZero.', by: author === 'me' ? 'Você' : 'Cidadão' }];
    if (status !== 'recebido') {
      history.push({ status: 'triagem', title: 'Triagem iniciada', date: new Date(clampNow(t0 + (6 + (i % 5) * 5) * H)).toISOString(), note: 'A equipe conferiu local, fotos e descrição. O relato foi publicado no mapa sem dados pessoais.', by: 'Equipe EsgotoZero' });
    }
    if (status === 'encaminhado' || status === 'encerrado') {
      history.push({ status: 'encaminhado', title: 'Encaminhado ao órgão responsável', date: new Date(clampNow(t0 + (1 + (i % 3)) * D)).toISOString(), note: 'Envio simulado para demonstração. Nenhum órgão real foi contatado.', by: 'Equipe EsgotoZero', recipient: EZ.AGENCIES[i % 3] + ' · ' + city, external: 'SIM-' + (2026) + '-' + String(4000 + i * 37).slice(-4) });
    }
    let closeReason = '';
    if (status === 'encerrado') {
      closeReason = i % 4 === 1 ? 'duplicado' : 'resolvido';
      history.push({ status: 'encerrado', title: 'Relato encerrado', date: new Date(clampNow(t0 + (5 + (i % 6) * 2) * D)).toISOString(), note: closeReason === 'duplicado' ? 'Mesmo ponto de outro relato já acompanhado. Os dois foram reunidos.' : 'O órgão informou a limpeza e a correção da ligação irregular. Encerrar não garante a qualidade da água.', by: 'Equipe EsgotoZero' });
    }
    return {
      id, title, category, signs, severity, water, waterName, place, city, uf, lat, lng, status, published,
      description, observed: localDay(created), createdAt: created, updatedAt: history[history.length - 1].date,
      photo: photo ? 'seed:' + photo : null, photoConsent: !!photo, photoReviewed: !!photo && published,
      author: author === 'me' ? 'cidadao-demo' : 'comunidade-' + (i % 9), ongoing: !!ongoing,
      confirmations: conf, confirmedByMe: false, closeReason, duplicateOf: '', history, seed: true
    };
  });
};
