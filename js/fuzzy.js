export const CONJUNTOS = Object.freeze({
  umidade: Object.freeze({
    seco: Object.freeze([0, 0, 20, 50]),
    intermediario: Object.freeze([20, 50, 50, 80]),
    umido: Object.freeze([50, 80, 100, 100]),
  }),
  temperatura: Object.freeze({
    baixa: Object.freeze([10, 10, 15, 25]),
    media: Object.freeze([15, 25, 25, 35]),
    alta: Object.freeze([25, 35, 40, 40]),
  }),
  tempo: Object.freeze({
    curto: Object.freeze([0, 0, 0, 15]),
    medio: Object.freeze([0, 15, 15, 30]),
    longo: Object.freeze([15, 30, 30, 30]),
  }),
});

export const NOMES_CONJUNTOS = Object.freeze({
  seco: "seco",
  intermediario: "intermediário",
  umido: "úmido",
  baixa: "baixa",
  media: "média",
  alta: "alta",
  curto: "curto",
  medio: "médio",
  longo: "longo",
});

export const REGRAS_PADRAO = Object.freeze([
  Object.freeze({ id: "R1", umidade: "seco", temperatura: "baixa", consequente: "medio" }),
  Object.freeze({ id: "R2", umidade: "seco", temperatura: "media", consequente: "longo" }),
  Object.freeze({ id: "R3", umidade: "seco", temperatura: "alta", consequente: "longo" }),
  Object.freeze({ id: "R4", umidade: "intermediario", temperatura: "baixa", consequente: "curto" }),
  Object.freeze({ id: "R5", umidade: "intermediario", temperatura: "media", consequente: "medio" }),
  Object.freeze({ id: "R6", umidade: "intermediario", temperatura: "alta", consequente: "longo" }),
  Object.freeze({ id: "R7", umidade: "umido", temperatura: "baixa", consequente: "curto" }),
  Object.freeze({ id: "R8", umidade: "umido", temperatura: "media", consequente: "curto" }),
  Object.freeze({ id: "R9", umidade: "umido", temperatura: "alta", consequente: "curto" }),
]);

export const PASSOS_DELTA_Z = Object.freeze([0.1, 0.05, 0.01]);

const LIMITES = Object.freeze({
  umidade: Object.freeze([0, 100]),
  temperatura: Object.freeze([10, 40]),
});

const CHAVES_CONSEQUENTE = Object.freeze(["curto", "medio", "longo"]);

export function pertinencia(valor, [a, b, c, d]) {
  if (!Number.isFinite(valor)) {
    throw new TypeError("O valor da pertinência deve ser um número finito.");
  }
  if (![a, b, c, d].every(Number.isFinite) || a > b || b > c || c > d) {
    throw new RangeError("Os pontos do conjunto devem obedecer a ≤ b ≤ c ≤ d.");
  }

  if (valor >= b && valor <= c) return 1;
  if (valor < a || valor > d) return 0;
  if (valor < b) return (valor - a) / (b - a);
  return (d - valor) / (d - c);
}

function validarEntrada(nome, valor) {
  if (!Number.isFinite(valor)) {
    throw new TypeError(`${nome} deve ser um número finito.`);
  }
  const [minimo, maximo] = LIMITES[nome];
  if (valor < minimo || valor > maximo) {
    throw new RangeError(`${nome} deve estar entre ${minimo} e ${maximo}.`);
  }
}

function validarPasso(deltaZ) {
  if (!PASSOS_DELTA_Z.includes(deltaZ)) {
    throw new RangeError("O passo Δz deve ser 0,1, 0,05 ou 0,01 minuto.");
  }
  const quantidade = 30 / deltaZ;
  if (!Number.isInteger(quantidade)) {
    throw new RangeError("O passo Δz deve dividir o intervalo de 0 a 30 minutos.");
  }
}

export function fuzzificar(umidade, temperatura) {
  validarEntrada("umidade", umidade);
  validarEntrada("temperatura", temperatura);

  return {
    umidade: Object.fromEntries(
      Object.entries(CONJUNTOS.umidade).map(([nome, pontos]) => [
        nome,
        pertinencia(umidade, pontos),
      ]),
    ),
    temperatura: Object.fromEntries(
      Object.entries(CONJUNTOS.temperatura).map(([nome, pontos]) => [
        nome,
        pertinencia(temperatura, pontos),
      ]),
    ),
  };
}

export function avaliarRegras(graus, consequentes = {}) {
  return REGRAS_PADRAO.map((regra) => {
    const consequente = consequentes[regra.id] ?? regra.consequente;
    if (!CHAVES_CONSEQUENTE.includes(consequente)) {
      throw new RangeError(`Consequente inválido para ${regra.id}.`);
    }

    const grauUmidade = graus.umidade[regra.umidade];
    const grauTemperatura = graus.temperatura[regra.temperatura];
    return {
      ...regra,
      consequente,
      grauUmidade,
      grauTemperatura,
      ativacao: Math.min(grauUmidade, grauTemperatura),
    };
  });
}

export function agregarEm(regras, z) {
  if (!Number.isFinite(z) || z < 0 || z > 30) {
    throw new RangeError("O tempo consultado deve estar entre 0 e 30 minutos.");
  }
  return regras.reduce((maior, regra) => {
    const grauConsequente = pertinencia(z, CONJUNTOS.tempo[regra.consequente]);
    return Math.max(maior, Math.min(regra.ativacao, grauConsequente));
  }, 0);
}

export function inferir({ umidade, temperatura, deltaZ = 0.1, consequentes = {} }) {
  validarPasso(deltaZ);
  const graus = fuzzificar(umidade, temperatura);
  const regras = avaliarRegras(graus, consequentes);
  const quantidade = Math.round(30 / deltaZ);
  let somaPertinencias = 0;
  let somaMomentos = 0;
  const pontos = [];

  for (let k = 0; k < quantidade; k += 1) {
    const z = (k + 0.5) * deltaZ;
    const porRegra = Object.fromEntries(
      regras.map((regra) => [
        regra.id,
        Math.min(
          regra.ativacao,
          pertinencia(z, CONJUNTOS.tempo[regra.consequente]),
        ),
      ]),
    );
    const agregada = Math.max(0, ...Object.values(porRegra));
    pontos.push({ z, porRegra, agregada });
    somaPertinencias += agregada;
    somaMomentos += z * agregada;
  }

  if (somaPertinencias === 0) {
    throw new Error("A saída agregada ficou vazia; não é possível calcular o centróide.");
  }

  return {
    umidade,
    temperatura,
    deltaZ,
    graus,
    regras,
    pontos,
    area: somaPertinencias * deltaZ,
    momento: somaMomentos * deltaZ,
    centroide: somaMomentos / somaPertinencias,
  };
}
