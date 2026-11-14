import { fuzzificar, inferir, pertinencia } from "./fuzzy.js";

const toleranciaGrau = 0.000001;
const toleranciaTempo = 0.01;

function proximo(a, b, tolerancia, mensagem) {
  if (Math.abs(a - b) > tolerancia) {
    throw new Error(`${mensagem}: esperado ${b}, recebido ${a}.`);
  }
}

function exigir(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem);
}

function executarCaso(nome, funcao, resultados) {
  try {
    funcao();
    resultados.push({ nome, ok: true });
  } catch (erro) {
    resultados.push({ nome, ok: false, erro: erro.message });
  }
}

export function executarTestes() {
  const resultados = [];

  executarCaso("Função trapezoidal e conjuntos de borda", () => {
    proximo(pertinencia(0, [0, 0, 20, 50]), 1, toleranciaGrau, "seco(0)");
    proximo(pertinencia(100, [50, 80, 100, 100]), 1, toleranciaGrau, "úmido(100)");
    proximo(pertinencia(10, [10, 10, 15, 25]), 1, toleranciaGrau, "baixa(10)");
    proximo(pertinencia(40, [25, 35, 40, 40]), 1, toleranciaGrau, "alta(40)");
    proximo(pertinencia(0, [0, 0, 0, 15]), 1, toleranciaGrau, "curto(0)");
    proximo(pertinencia(30, [15, 30, 30, 30]), 1, toleranciaGrau, "longo(30)");
    proximo(pertinencia(15, [0, 15, 15, 30]), 1, toleranciaGrau, "médio(15)");
  }, resultados);

  executarCaso("Pertinências de referência em U=35% e T=30°C", () => {
    const graus = fuzzificar(35, 30);
    proximo(graus.umidade.seco, 0.5, toleranciaGrau, "seco");
    proximo(graus.umidade.intermediario, 0.5, toleranciaGrau, "intermediário");
    proximo(graus.umidade.umido, 0, toleranciaGrau, "úmido");
    proximo(graus.temperatura.baixa, 0, toleranciaGrau, "baixa");
    proximo(graus.temperatura.media, 0.5, toleranciaGrau, "média");
    proximo(graus.temperatura.alta, 0.5, toleranciaGrau, "alta");
  }, resultados);

  executarCaso("Ativação isolada de R3, R5 e R8", () => {
    const r3 = inferir({ umidade: 20, temperatura: 35 });
    exigir(r3.regras.filter((regra) => regra.ativacao > 0).map((regra) => regra.id).join() === "R3", "U=20 e T=35 deve ativar somente R3.");
    proximo(r3.centroide, 25, toleranciaTempo, "centróide longo");

    const r5 = inferir({ umidade: 50, temperatura: 25 });
    exigir(r5.regras.filter((regra) => regra.ativacao > 0).map((regra) => regra.id).join() === "R5", "U=50 e T=25 deve ativar somente R5.");
    proximo(r5.centroide, 15, toleranciaTempo, "centróide médio");

    const r8 = inferir({ umidade: 80, temperatura: 25 });
    exigir(r8.regras.filter((regra) => regra.ativacao > 0).map((regra) => regra.id).join() === "R8", "U=80 e T=25 deve ativar somente R8.");
    proximo(r8.centroide, 5, toleranciaTempo, "centróide curto");
  }, resultados);

  executarCaso("Inferência padrão com sobreposição", () => {
    const resultado = inferir({ umidade: 35, temperatura: 30, deltaZ: 0.1 });
    for (const [z, esperado] of [[0, 0], [3, 0.2], [7.5, 0.5], [15, 0.5], [30, 0.5]]) {
      proximo(
        resultado.regras.reduce((maximo, regra) => {
          const grau = Math.min(regra.ativacao, pertinencia(z, {
            curto: [0, 0, 0, 15],
            medio: [0, 15, 15, 30],
            longo: [15, 30, 30, 30],
          }[regra.consequente]));
          return Math.max(maximo, grau);
        }, 0),
        esperado,
        toleranciaGrau,
        `μ agregada(${z})`,
      );
    }
    proximo(resultado.centroide, 16.785683, toleranciaTempo, "centróide de referência");
    proximo(resultado.area, 13.125, toleranciaGrau, "área agregada");
  }, resultados);

  executarCaso("Simetria e alteração dos nove consequentes", () => {
    const simetrico = inferir({ umidade: 35, temperatura: 20 });
    proximo(simetrico.centroide, 15, toleranciaTempo, "centróide simétrico");
    const curto = Object.fromEntries(Array.from({ length: 9 }, (_, indice) => [`R${indice + 1}`, "curto"]));
    const alterado = inferir({ umidade: 50, temperatura: 25, consequentes: curto });
    proximo(alterado.centroide, 5, toleranciaTempo, "centróide com todas as regras curtas");
  }, resultados);

  executarCaso("Precisão para os três passos Δz", () => {
    const referencias = [
      [0.1, 16.785683],
      [0.05, 16.785706],
      [0.01, 16.785714],
    ];
    for (const [deltaZ, esperado] of referencias) {
      const resultado = inferir({ umidade: 35, temperatura: 30, deltaZ });
      proximo(resultado.centroide, esperado, toleranciaTempo, `Δz=${deltaZ}`);
    }
  }, resultados);

  executarCaso("Entradas inválidas são rejeitadas", () => {
    for (const entrada of [
      { umidade: -1, temperatura: 30 },
      { umidade: 101, temperatura: 30 },
      { umidade: 35, temperatura: 9 },
      { umidade: 35, temperatura: 41 },
      { umidade: Number.NaN, temperatura: 30 },
    ]) {
      let rejeitada = false;
      try {
        inferir(entrada);
      } catch {
        rejeitada = true;
      }
      exigir(rejeitada, `A entrada ${JSON.stringify(entrada)} deveria ser rejeitada.`);
    }
  }, resultados);

  return resultados;
}
