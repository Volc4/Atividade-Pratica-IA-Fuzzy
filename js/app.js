import {
  CONJUNTOS,
  NOMES_CONJUNTOS,
  REGRAS_PADRAO,
  agregarEm,
  inferir,
  pertinencia,
} from "./fuzzy.js";

const ETAPAS = [
  "Fuzzificação",
  "Avaliação das regras",
  "Implicação",
  "Agregação",
  "Defuzzificação",
];
const CORES = ["#2563eb", "#e87924", "#138a72", "#a14fce", "#d34b65", "#687789", "#b28a00", "#2887a3", "#875c43"];

const elementos = {
  umidade: document.querySelector("#umidade"),
  umidadeNumero: document.querySelector("#umidade-numero"),
  temperatura: document.querySelector("#temperatura"),
  temperaturaNumero: document.querySelector("#temperatura-numero"),
  deltaZ: document.querySelector("#delta-z"),
  regras: document.querySelector("#regras"),
  calcular: document.querySelector("#calcular"),
  avancar: document.querySelector("#avancar"),
  restaurar: document.querySelector("#restaurar"),
  mensagem: document.querySelector("#mensagem"),
  etapas: document.querySelector("#etapas"),
  detalheEtapa: document.querySelector("#detalhe-etapa"),
  resultado: document.querySelector("#resultado"),
  graficoUmidade: document.querySelector("#grafico-umidade"),
  graficoTemperatura: document.querySelector("#grafico-temperatura"),
  graficoSaida: document.querySelector("#grafico-saida"),
};

let resultadoAtual = null;
let etapaAtual = -1;

function criarSeletorDeRegras() {
  for (const regra of REGRAS_PADRAO) {
    const rotulo = document.createElement("label");
    rotulo.className = "regra-seletor";
    rotulo.htmlFor = `consequente-${regra.id}`;

    const texto = document.createElement("span");
    texto.textContent = `${regra.id}: se o solo for ${NOMES_CONJUNTOS[regra.umidade]} e a temperatura ${NOMES_CONJUNTOS[regra.temperatura]}`;

    const seletor = document.createElement("select");
    seletor.id = `consequente-${regra.id}`;
    seletor.dataset.regra = regra.id;
    seletor.setAttribute("aria-label", `Consequente da regra ${regra.id}`);
    for (const [valor, nome] of [["curto", "Curto"], ["medio", "Médio"], ["longo", "Longo"]]) {
      const opcao = document.createElement("option");
      opcao.value = valor;
      opcao.textContent = nome;
      seletor.append(opcao);
    }
    seletor.value = regra.consequente;
    seletor.addEventListener("change", invalidarResultado);

    rotulo.append(texto, seletor);
    elementos.regras.append(rotulo);
  }
}

function formatar(valor, casas = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(valor);
}

function formatarGrau(valor) {
  return formatar(valor, 4);
}

function montarTabela(cabecalhos, linhas, legenda) {
  const tabela = document.createElement("table");
  tabela.className = "tabela-dados";
  if (legenda) {
    const caption = document.createElement("caption");
    caption.textContent = legenda;
    tabela.append(caption);
  }

  const thead = document.createElement("thead");
  const linhaCabecalho = document.createElement("tr");
  for (const cabecalho of cabecalhos) {
    const celula = document.createElement("th");
    celula.scope = "col";
    celula.textContent = cabecalho;
    linhaCabecalho.append(celula);
  }
  thead.append(linhaCabecalho);

  const tbody = document.createElement("tbody");
  for (const linha of linhas) {
    const tr = document.createElement("tr");
    for (const valor of linha) {
      const celula = document.createElement("td");
      celula.textContent = String(valor);
      tr.append(celula);
    }
    tbody.append(tr);
  }
  tabela.append(thead, tbody);
  return tabela;
}

function criarSecao(titulo, descricao) {
  const secao = document.createElement("section");
  secao.className = "etapa-conteudo";
  const heading = document.createElement("h3");
  heading.textContent = titulo;
  const paragrafo = document.createElement("p");
  paragrafo.textContent = descricao;
  secao.append(heading, paragrafo);
  return secao;
}

function grausDaRegra(regra, resultado) {
  return {
    umidade: resultado.graus.umidade[regra.umidade],
    temperatura: resultado.graus.temperatura[regra.temperatura],
  };
}

function criarCurva(nome, conjunto, cor, quantidade = 201, min = 0, max = 100) {
  const pontos = Array.from({ length: quantidade }, (_, indice) => {
    const x = min + ((max - min) * indice) / (quantidade - 1);
    return { x, y: pertinencia(x, conjunto) };
  });
  return { nome, pontos, cor };
}

function desenharGrafico(canvas, configuracao) {
  const larguraCss = Math.max(canvas.clientWidth, 300);
  const alturaCss = Math.max(canvas.clientHeight, 230);
  const escala = window.devicePixelRatio || 1;
  canvas.width = Math.round(larguraCss * escala);
  canvas.height = Math.round(alturaCss * escala);
  const contexto = canvas.getContext("2d");
  contexto.setTransform(escala, 0, 0, escala, 0, 0);
  contexto.clearRect(0, 0, larguraCss, alturaCss);

  const margem = { esquerda: 48, direita: 16, topo: 16, baixo: 38 };
  const grafico = {
    esquerda: margem.esquerda,
    topo: margem.topo,
    largura: larguraCss - margem.esquerda - margem.direita,
    altura: alturaCss - margem.topo - margem.baixo,
  };
  const xTela = (x) => grafico.esquerda + ((x - configuracao.min) / (configuracao.max - configuracao.min)) * grafico.largura;
  const yTela = (y) => grafico.topo + grafico.altura - y * grafico.altura;

  contexto.font = "11px system-ui, sans-serif";
  contexto.textAlign = "right";
  contexto.textBaseline = "middle";
  for (let indice = 0; indice <= 4; indice += 1) {
    const valor = indice / 4;
    const y = yTela(valor);
    contexto.strokeStyle = "#e3e9ee";
    contexto.beginPath();
    contexto.moveTo(grafico.esquerda, y);
    contexto.lineTo(grafico.esquerda + grafico.largura, y);
    contexto.stroke();
    contexto.fillStyle = "#536273";
    contexto.fillText(formatar(valor, 2), grafico.esquerda - 8, y);
  }

  const divisoesX = 4;
  contexto.textAlign = "center";
  contexto.textBaseline = "top";
  for (let indice = 0; indice <= divisoesX; indice += 1) {
    const valor = configuracao.min + ((configuracao.max - configuracao.min) * indice) / divisoesX;
    const x = xTela(valor);
    contexto.strokeStyle = "#f0f3f5";
    contexto.beginPath();
    contexto.moveTo(x, grafico.topo);
    contexto.lineTo(x, grafico.topo + grafico.altura);
    contexto.stroke();
    contexto.fillStyle = "#536273";
    contexto.fillText(formatar(valor, configuracao.casasX ?? 0), x, grafico.topo + grafico.altura + 8);
  }

  contexto.strokeStyle = "#73808c";
  contexto.lineWidth = 1;
  contexto.beginPath();
  contexto.moveTo(grafico.esquerda, grafico.topo);
  contexto.lineTo(grafico.esquerda, grafico.topo + grafico.altura);
  contexto.lineTo(grafico.esquerda + grafico.largura, grafico.topo + grafico.altura);
  contexto.stroke();

  if (configuracao.agregacao) {
    const larguraPasso = grafico.largura / configuracao.agregacao.pontos.length;
    contexto.fillStyle = "rgba(36, 119, 105, 0.25)";
    for (let indice = 0; indice < configuracao.agregacao.pontos.length; indice += 1) {
      const ponto = configuracao.agregacao.pontos[indice];
      const x = grafico.esquerda + indice * larguraPasso;
      const y = yTela(ponto.agregada);
      contexto.fillRect(x, y, larguraPasso + 0.5, grafico.topo + grafico.altura - y);
    }
  }

  for (const serie of configuracao.series) {
    contexto.save();
    contexto.strokeStyle = serie.cor;
    contexto.lineWidth = serie.largura ?? 2;
    contexto.globalAlpha = serie.opacidade ?? 1;
    contexto.setLineDash(serie.tracejado ? [5, 4] : []);
    contexto.beginPath();
    serie.pontos.forEach((ponto, indice) => {
      const x = xTela(ponto.x);
      const y = yTela(ponto.y);
      if (indice === 0) contexto.moveTo(x, y);
      else contexto.lineTo(x, y);
    });
    contexto.stroke();
    contexto.restore();
  }

  if (configuracao.agregacao) {
    const pontos = configuracao.agregacao.pontos;
    const larguraPasso = grafico.largura / pontos.length;
    contexto.strokeStyle = "#176f63";
    contexto.lineWidth = 2.5;
    contexto.beginPath();
    pontos.forEach((ponto, indice) => {
      const x = grafico.esquerda + indice * larguraPasso;
      const y = yTela(ponto.agregada);
      if (indice === 0) contexto.moveTo(x, y);
      else contexto.lineTo(x, y);
      contexto.lineTo(x + larguraPasso, y);
    });
    contexto.stroke();
  }

  if (Number.isFinite(configuracao.marcadorX)) {
    const x = xTela(configuracao.marcadorX);
    contexto.save();
    contexto.strokeStyle = "#14283d";
    contexto.lineWidth = 1.5;
    contexto.setLineDash([4, 4]);
    contexto.beginPath();
    contexto.moveTo(x, grafico.topo);
    contexto.lineTo(x, grafico.topo + grafico.altura);
    contexto.stroke();
    contexto.restore();
  }

  contexto.fillStyle = "#344454";
  contexto.textAlign = "center";
  contexto.textBaseline = "bottom";
  contexto.font = "12px system-ui, sans-serif";
  contexto.fillText(configuracao.rotuloX, grafico.esquerda + grafico.largura / 2, alturaCss - 2);
  contexto.save();
  contexto.translate(12, grafico.topo + grafico.altura / 2);
  contexto.rotate(-Math.PI / 2);
  contexto.textBaseline = "top";
  contexto.fillText("Grau de pertinência", 0, 0);
  contexto.restore();

  const legenda = document.querySelector(`#${canvas.id}-legenda`);
  if (legenda) {
    legenda.replaceChildren();
    for (const serie of configuracao.series) {
      const item = document.createElement("span");
      item.className = "item-legenda";
      const amostra = document.createElement("i");
      amostra.style.backgroundColor = serie.cor;
      item.append(amostra, document.createTextNode(serie.nome));
      legenda.append(item);
    }
    if (configuracao.agregacao) {
      const item = document.createElement("span");
      item.className = "item-legenda";
      const amostra = document.createElement("i");
      amostra.style.backgroundColor = "#176f63";
      item.append(amostra, document.createTextNode("saída agregada"));
      legenda.append(item);
    }
  }
}

function desenharGraficoEntrada(canvas, tipo, valor) {
  const conjuntos = CONJUNTOS[tipo];
  const cores = ["#2563eb", "#e87924", "#138a72"];
  const maximo = tipo === "umidade" ? 100 : 40;
  const minimo = tipo === "umidade" ? 0 : 10;
  const series = Object.entries(conjuntos).map(([chave, pontos], indice) =>
    criarCurva(NOMES_CONJUNTOS[chave], pontos, cores[indice], 301, minimo, maximo),
  );
  const graus = resultadoAtual.graus[tipo];
  desenharGrafico(canvas, {
    min: minimo,
    max: maximo,
    marcadorX: valor,
    rotuloX: tipo === "umidade" ? "Umidade do solo (%)" : "Temperatura (°C)",
    series,
  });
  return Object.entries(graus)
    .map(([chave, grau]) => `${NOMES_CONJUNTOS[chave]}: ${formatarGrau(grau)}`)
    .join(" · ");
}

function desenharGraficoSaida(modo) {
  const coresSaida = { curto: "#2563eb", medio: "#e87924", longo: "#138a72" };
  const series = Object.entries(CONJUNTOS.tempo).map(([chave, pontos]) =>
    criarCurva(NOMES_CONJUNTOS[chave], pontos, coresSaida[chave], 301, 0, 30),
  );
  const configuracao = {
    min: 0,
    max: 30,
    casasX: 0,
    rotuloX: "Tempo de irrigação (min)",
    series,
  };

  if (modo === "implicacao") {
    configuracao.series = [
      ...series.map((serie) => ({ ...serie, opacidade: 0.4, largura: 1.5 })),
      ...resultadoAtual.regras
        .filter((regra) => regra.ativacao > 0)
        .map((regra, indice) => {
          const conjunto = CONJUNTOS.tempo[regra.consequente];
          return {
            nome: `${regra.id} recortada`,
            cor: CORES[indice],
            tracejado: true,
            largura: 1.7,
            pontos: Array.from({ length: 301 }, (_, amostra) => {
              const x = amostra / 10;
              return {
                x,
                y: Math.min(regra.ativacao, pertinencia(x, conjunto)),
              };
            }),
          };
        }),
    ];
  } else {
    configuracao.agregacao = resultadoAtual;
  }

  if (modo === "defuzzificacao") configuracao.marcadorX = resultadoAtual.centroide;
  desenharGrafico(elementos.graficoSaida, configuracao);
}

function renderizarEtapa() {
  if (!resultadoAtual || etapaAtual < 0) return;
  const secao = criarSecao(
    `${etapaAtual + 1}. ${ETAPAS[etapaAtual]}`,
    [
      "Calcule os graus de pertinência para as entradas informadas.",
      "Cada regra usa o mínimo entre os graus de umidade e temperatura.",
      "Cada conjunto de saída é recortado na altura de ativação da regra.",
      "A saída final usa o máximo das saídas recortadas em cada ponto.",
      "O centróide é aproximado pela soma ponderada nos pontos médios do intervalo.",
    ][etapaAtual],
  );

  if (etapaAtual === 0) {
    const umidadeGrau = desenharGraficoEntrada(
      elementos.graficoUmidade,
      "umidade",
      resultadoAtual.umidade,
    );
    const temperaturaGrau = desenharGraficoEntrada(
      elementos.graficoTemperatura,
      "temperatura",
      resultadoAtual.temperatura,
    );
    secao.append(
      montarTabela(
        ["Entrada", "Valor", "Graus de pertinência"],
        [
          [`Umidade do solo`, `${formatar(resultadoAtual.umidade)}%`, umidadeGrau],
          [`Temperatura`, `${formatar(resultadoAtual.temperatura)} °C`, temperaturaGrau],
        ],
        "Fuzzificação das entradas",
      ),
    );
    desenharGraficoSaida("agregacao");
  } else if (etapaAtual === 1) {
    const linhas = resultadoAtual.regras.map((regra) => [
      regra.id,
      `${NOMES_CONJUNTOS[regra.umidade]} (${formatarGrau(regra.grauUmidade)})`,
      `${NOMES_CONJUNTOS[regra.temperatura]} (${formatarGrau(regra.grauTemperatura)})`,
      `mínimo = ${formatarGrau(regra.ativacao)}`,
      regra.ativacao > 0 ? "Ativada" : "Não ativada",
    ]);
    secao.append(
      montarTabela(
        ["Regra", "Antecedente: umidade", "Antecedente: temperatura", "Ativação h(r)", "Estado"],
        linhas,
        "Avaliação completa das nove regras",
      ),
    );
    desenharGraficoSaida("agregacao");
  } else if (etapaAtual === 2) {
    const linhas = resultadoAtual.regras.map((regra) => [
      regra.id,
      formatarGrau(regra.ativacao),
      NOMES_CONJUNTOS[regra.consequente],
      regra.ativacao > 0 ? `μrecortada(z) = min(${formatarGrau(regra.ativacao)}, μconsequente(z))` : "Sem contribuição",
    ]);
    secao.append(
      montarTabela(["Regra", "Ativação", "Consequente original", "Implicação"], linhas),
    );
    desenharGraficoSaida("implicacao");
  } else if (etapaAtual === 3) {
    const verificacoes = [0, 3, 7.5, 15, 30].map((z) => [
      `${formatar(z, z === 7.5 ? 1 : 0)} min`,
      formatarGrau(agregarEm(resultadoAtual.regras, z)),
    ]);
    secao.append(
      montarTabela(
        ["Tempo z", "μ agregada(z)"],
        verificacoes,
        "Pontos de conferência da agregação",
      ),
    );
    desenharGraficoSaida("agregacao");
  } else {
    secao.append(
      montarTabela(
        ["Grandeza", "Valor"],
        [
          ["Passo Δz", `${formatar(resultadoAtual.deltaZ, resultadoAtual.deltaZ === 0.01 ? 2 : resultadoAtual.deltaZ === 0.05 ? 2 : 1)} min`],
          ["Área aproximada", formatar(resultadoAtual.area, 6)],
          ["Momento aproximado", formatar(resultadoAtual.momento, 6)],
          ["Centróide", `${formatar(resultadoAtual.centroide)} min`],
        ],
        "Defuzzificação por pontos médios",
      ),
    );
    desenharGraficoSaida("defuzzificacao");
  }

  elementos.detalheEtapa.replaceChildren(secao);
  for (const item of elementos.etapas.querySelectorAll("li")) {
    const indice = Number(item.dataset.etapa);
    item.classList.toggle("etapa-atual", indice === etapaAtual);
    item.classList.toggle("etapa-concluida", indice < etapaAtual);
    if (indice === etapaAtual) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  }
  elementos.avancar.disabled = etapaAtual === ETAPAS.length - 1;
  elementos.avancar.textContent =
    etapaAtual === ETAPAS.length - 1 ? "Etapas concluídas" : "Avançar etapa";
  elementos.resultado.textContent = `${formatar(resultadoAtual.centroide)} min`;
}

function consequentesSelecionados() {
  return Object.fromEntries(
    [...elementos.regras.querySelectorAll("select")].map((seletor) => [
      seletor.dataset.regra,
      seletor.value,
    ]),
  );
}

function lerNumero(campo, nome) {
  const valor = campo.value.trim();
  if (valor === "") throw new TypeError(`Informe ${nome}.`);
  const numero = Number(valor);
  if (!Number.isFinite(numero)) throw new TypeError(`${nome} deve ser um número.`);
  const minimo = Number(campo.min);
  const maximo = Number(campo.max);
  if (numero < minimo || numero > maximo) {
    throw new RangeError(`${nome} deve estar entre ${minimo} e ${maximo}.`);
  }
  return numero;
}

function calcular() {
  try {
    const umidade = lerNumero(elementos.umidadeNumero, "a umidade");
    const temperatura = lerNumero(elementos.temperaturaNumero, "a temperatura");
    resultadoAtual = inferir({
      umidade,
      temperatura,
      deltaZ: Number(elementos.deltaZ.value),
      consequentes: consequentesSelecionados(),
    });
    elementos.umidadeNumero.setAttribute("aria-invalid", "false");
    elementos.temperaturaNumero.setAttribute("aria-invalid", "false");
    etapaAtual = 0;
    elementos.mensagem.textContent = "Inferência concluída. Avance pelas etapas para conferir os cálculos.";
    elementos.mensagem.className = "mensagem sucesso";
    renderizarEtapa();
  } catch (erro) {
    elementos.mensagem.textContent = erro.message;
    elementos.mensagem.className = "mensagem erro";
    elementos.umidadeNumero.setAttribute("aria-invalid", String(erro.message.includes("umidade")));
    elementos.temperaturaNumero.setAttribute("aria-invalid", String(erro.message.includes("temperatura")));
  }
}

function invalidarResultado() {
  resultadoAtual = null;
  etapaAtual = -1;
  elementos.resultado.textContent = "—";
  elementos.avancar.disabled = true;
  elementos.avancar.textContent = "Avançar etapa";
  elementos.detalheEtapa.replaceChildren();
  for (const item of elementos.etapas.querySelectorAll("li")) {
    item.classList.remove("etapa-atual", "etapa-concluida");
    item.removeAttribute("aria-current");
  }
  elementos.mensagem.textContent = "Configuração alterada. Calcule novamente para atualizar os resultados.";
  elementos.mensagem.className = "mensagem aviso";
  document.querySelectorAll(".grafico").forEach((canvas) => {
    const contexto = canvas.getContext("2d");
    contexto.clearRect(0, 0, canvas.width, canvas.height);
    const legenda = document.querySelector(`#${canvas.id}-legenda`);
    if (legenda) legenda.replaceChildren();
  });
}

function restaurarPadrao() {
  elementos.umidade.value = "35";
  elementos.umidadeNumero.value = "35";
  elementos.temperatura.value = "30";
  elementos.temperaturaNumero.value = "30";
  elementos.umidadeNumero.setAttribute("aria-invalid", "false");
  elementos.temperaturaNumero.setAttribute("aria-invalid", "false");
  elementos.deltaZ.value = "0.1";
  for (const regra of REGRAS_PADRAO) {
    const seletor = elementos.regras.querySelector(`[data-regra="${regra.id}"]`);
    seletor.value = regra.consequente;
  }
  invalidarResultado();
  elementos.mensagem.textContent = "Valores e consequentes padrão restaurados.";
}

function sincronizarControles(origem, destino) {
  origem.addEventListener("input", () => {
    destino.value = origem.value;
    origem.setAttribute("aria-invalid", "false");
    destino.setAttribute("aria-invalid", "false");
    invalidarResultado();
  });
}

function iniciar() {
  criarSeletorDeRegras();
  sincronizarControles(elementos.umidade, elementos.umidadeNumero);
  sincronizarControles(elementos.umidadeNumero, elementos.umidade);
  sincronizarControles(elementos.temperatura, elementos.temperaturaNumero);
  sincronizarControles(elementos.temperaturaNumero, elementos.temperatura);
  elementos.deltaZ.addEventListener("change", invalidarResultado);
  elementos.calcular.addEventListener("click", calcular);
  elementos.avancar.addEventListener("click", () => {
    if (resultadoAtual && etapaAtual < ETAPAS.length - 1) {
      etapaAtual += 1;
      renderizarEtapa();
    }
  });
  elementos.restaurar.addEventListener("click", restaurarPadrao);
  window.addEventListener("resize", () => {
    if (resultadoAtual) renderizarEtapa();
  });
  calcular();
}

iniciar();
