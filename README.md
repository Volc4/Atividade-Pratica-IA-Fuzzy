# IrrigaFuzzy

Simulador didático de um controlador Mamdani para recomendar o tempo de irrigação. A aplicação é estática e usa HTML, CSS e JavaScript puro, conforme o enunciado; não exige servidor de aplicação nem bibliotecas de IA ou lógica fuzzy.

## Executar

Como os módulos JavaScript são carregados pelo navegador, inicie um servidor HTTP estático na pasta do projeto (por exemplo, `py -m http.server 8000`) e abra `http://localhost:8000`. Não há servidor de aplicação: o comando apenas entrega os arquivos estáticos. Para executar os casos automatizados, acesse `http://localhost:8000/tests.html`; cada resultado é exibido na página sem dependências externas.

Para publicar no GitHub Pages, envie os arquivos deste projeto para um repositório e selecione a branch e a pasta raiz em **Settings → Pages**. A página inicial é `index.html`.

## Modelo

- Entradas: umidade do solo de 0% a 100% (padrão 35%) e temperatura de 10 °C a 40 °C (padrão 30 °C).
- Saída: tempo de irrigação de 0 a 30 minutos.
- Conjuntos trapezoidais: seco/intermediário/úmido, baixa/média/alta e curto/médio/longo, conforme os pontos do enunciado.
- Base de nove regras; antecedentes fixos e consequente configurável em cada regra.
- Operador E: mínimo; implicação: corte pelo mínimo; agregação: máximo; defuzzificação: centróide numérico por pontos médios.
- Passos de integração disponíveis: 0,1, 0,05 e 0,01 minuto.

O botão **Calcular** executa a inferência. **Avançar etapa** apresenta fuzzificação, avaliação das regras, implicação, agregação e defuzzificação; qualquer alteração na configuração invalida os resultados anteriores. **Restaurar padrão** repõe entradas, passo e consequentes.

## Validação

Abra `tests.html` para conferir as pertinências de referência, os extremos dos conjuntos, as ativações isoladas de R3/R5/R8, a entrada padrão com sobreposição, a simetria, os três passos numéricos e a rejeição de entradas fora dos intervalos.

## Autoria

Preencha aqui os nomes dos integrantes do grupo antes da entrega.
