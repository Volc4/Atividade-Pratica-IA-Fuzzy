# IrrigaFuzzy — sistema fuzzy Mamdani para irrigação

Simulador didático de um sistema fuzzy Mamdani que recomenda o tempo de irrigação de um jardim a partir da umidade do solo e da temperatura. Roda inteiro no navegador com HTML, CSS e JavaScript puro, sem servidor de aplicação.

- Aplicação (GitHub Pages): https://volc4.github.io/Atividade-Pratica-IA-Fuzzy/
- Repositório: https://github.com/Volc4/Atividade-Pratica-IA-Fuzzy

## Autores

- Luidge de Sousa Carvalho
- Samuel Lucas Alves Matos

## Modelo Mamdani

- **Entradas:** umidade do solo U, de 0% a 100%, e temperatura T, de 10 °C a 40 °C.
- **Saída:** tempo de irrigação z, de 0 a 30 minutos.

A inferência tem cinco etapas, implementadas em `js/fuzzy.js`:

1. **Fuzzificação.** Calcula os três graus de pertinência da umidade e os três da temperatura. A função de pertinência linear por partes (a, b, c, d) avalia primeiro o trecho de pertinência 1 (b ≤ x ≤ c), depois o exterior [a, d] e só então as rampas. Assim, quando a = b ou c = d, a divisão da rampa vazia nunca é calculada.
2. **Avaliação das regras.** O operador E é o mínimo: h(r) = min(μumidade(U), μtemperatura(T)).
3. **Implicação.** O consequente de cada regra é recortado na altura h(r): μr(z) = min(h(r), μconsequente(z)). Regras com h = 0 não contribuem.
4. **Agregação.** Para cada z, μagregada(z) = max(μ1(z), …, μ9(z)). As áreas não são somadas e não se escolhe só a regra mais ativada.
5. **Defuzzificação.** Centroide numérico por pontos médios: N = 30/Δz, z(k) = (k + 0,5)·Δz, z* = Σ[z(k)·μagregada(z(k))] / Σ[μagregada(z(k))]. Se o denominador for zero, a aplicação informa que não há saída agregada válida, em vez de retornar zero.

Os cálculos mantêm a precisão do JavaScript (double). O arredondamento acontece só na exibição: graus com 4 casas e tempo com 2 casas. Os graus de pertinência são graus de compatibilidade com os termos linguísticos, não probabilidades, e não precisam somar 1.

### Conjuntos (a, b, c, d)

| Variável | Conjunto | Pontos |
|---|---|---|
| Umidade (%) | seco | (0, 0, 20, 50) |
| | intermediário | (20, 50, 50, 80) |
| | úmido | (50, 80, 100, 100) |
| Temperatura (°C) | baixa | (10, 10, 15, 25) |
| | média | (15, 25, 25, 35) |
| | alta | (25, 35, 40, 40) |
| Tempo (min) | curto | (0, 0, 0, 15) |
| | médio | (0, 15, 15, 30) |
| | longo | (15, 30, 30, 30) |

### Regras padrão

| Regra | SE o solo é | E a temperatura é | ENTÃO o tempo é |
|---|---|---|---|
| R1 | seco | baixa | médio |
| R2 | seco | média | longo |
| R3 | seco | alta | longo |
| R4 | intermediário | baixa | curto |
| R5 | intermediário | média | médio |
| R6 | intermediário | alta | longo |
| R7 | úmido | baixa | curto |
| R8 | úmido | média | curto |
| R9 | úmido | alta | curto |

Os antecedentes são fixos. O consequente de cada regra pode ser trocado na interface (curto, médio ou longo).

## Instruções de uso

**Abrir.** Acesse o link do GitHub Pages; não há login nem instalação. Para rodar localmente, o JavaScript usa módulos, então os arquivos precisam ser servidos por HTTP. Um servidor estático basta, por exemplo `py -m http.server 8000` na pasta do projeto, e então abrir `http://localhost:8000`. Esse comando apenas entrega os arquivos; não há servidor de aplicação.

**Configurar.**
- Informe a umidade do solo (padrão 35%) e a temperatura (padrão 30 °C), pelo campo numérico ou pelo controle deslizante.
- Escolha o passo Δz (0,1; 0,05 ou 0,01 minuto; padrão 0,1).
- Em "Consequentes das nove regras", escolha curto, médio ou longo para cada regra.

**Calcular e acompanhar.**
- **Calcular** executa toda a inferência e mostra o tempo recomendado.
- **Avançar etapa** percorre as cinco etapas em ordem:
  1. **Fuzzificação:** graus de todos os conjuntos, inclusive os iguais a zero, e linhas verticais nos gráficos de entrada.
  2. **Regras:** as nove regras com os graus dos antecedentes, a conta min(a; b) = h(r) e as regras ativadas em destaque.
  3. **Implicação:** o seletor "Regra selecionada" mostra, no gráfico de saída, o consequente original da regra (tracejado) e o seu recorte (preenchido); há também um log por regra ativada.
  4. **Agregação:** a região agregada preenchida e os pontos de conferência.
  5. **Defuzzificação:** área, momento, centroide com 6 casas e a linha vertical do centroide.
- **Restaurar padrão** repõe as entradas, as regras e o passo iniciais e limpa os resultados.
- Qualquer alteração na configuração limpa os resultados e reinicia a sequência de etapas.
- Valores vazios, não numéricos ou fora dos intervalos bloqueiam o cálculo com uma mensagem. Eles não são corrigidos para o limite mais próximo.

**Testes automatizados.** Abra `tests.html` (no Pages: https://volc4.github.io/Atividade-Pratica-IA-Fuzzy/tests.html). Os casos são executados no navegador.

## Bibliotecas auxiliares

Nenhuma. A inferência, os gráficos (desenhados em `<canvas>` pelo próprio `js/app.js`) e a interface usam apenas HTML, CSS e JavaScript do navegador. A página não carrega nenhum arquivo externo.

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html`, `css/style.css` | Página e estilo |
| `js/fuzzy.js` | Motor Mamdani: pertinência, fuzzificação, regras, agregação e centroide |
| `js/app.js` | Interface: campos, validação, etapas, tabelas, logs e gráficos |
| `js/tests.js`, `tests.html` | Testes automatizados (7 casos) |

## Resultados dos testes

Salvo indicação contrária: base de regras padrão e Δz = 0,1 minuto. Tolerâncias: 0,000001 para pertinências e ativações; 0,01 minuto para tempos. Os valores foram obtidos executando `js/fuzzy.js` e conferidos na interface. `tests.html`: **7 de 7 casos aprovados**.

### 6.1 Pertinências e extremos

| Entrada | Esperado | Obtido |
|---|---|---|
| U = 35% (seco, intermediário, úmido) | 0,5; 0,5; 0 | 0,5; 0,5; 0 |
| T = 30 °C (baixa, média, alta) | 0; 0,5; 0,5 | 0; 0,5; 0,5 |
| U = 0% | (1, 0, 0) | (1, 0, 0) |
| U = 100% | (0, 0, 1) | (0, 0, 1) |
| T = 10 °C | (1, 0, 0) | (1, 0, 0) |
| T = 40 °C | (0, 0, 1) | (0, 0, 1) |
| μcurto(0) e μlongo(30) | 1 e 1 | 1 e 1 |

**Conclusão:** pertinências corretas, inclusive nos extremos (a = b ou c = d), sem divisão por zero.

### 6.2 Ativação de uma única regra

| Entrada | Regras ativadas | Esperado | Obtido (Δz = 0,1) | Exibido |
|---|---|---|---|---|
| U = 20%, T = 35 °C | só R3 (h = 1) | ≈ 25,00 min | 24,999889 min | 25,00 min |
| U = 50%, T = 25 °C | só R5 (h = 1) | 15,00 min | 15,000000 min | 15,00 min |
| U = 80%, T = 25 °C | só R8 (h = 1) | ≈ 5,00 min | 5,000111 min | 5,00 min |

**Conclusão:** a saída agregada é o conjunto completo da única regra ativa, e o tempo é o centroide do triângulo (5, 15 ou 25), não o pico. Solo úmido não dá tempo zero neste modelo. A diferença de 0,000111 min vem da aproximação numérica e está dentro da tolerância.

### 6.3 Inferência completa com sobreposição

Entrada: U = 35%, T = 30 °C, base padrão, Δz = 0,1.

- **Fuzzificação:** seco 0,5; intermediário 0,5; úmido 0; baixa 0; média 0,5; alta 0,5.
- **Regras ativadas:**
  - R2 → longo: min(0,5; 0,5) = 0,5;
  - R3 → longo: min(0,5; 0,5) = 0,5;
  - R5 → médio: min(0,5; 0,5) = 0,5;
  - R6 → longo: min(0,5; 0,5) = 0,5;
  - as outras cinco regras têm h = 0.
- **Implicação e agregação:** médio e longo recortados em 0,5 e combinados pelo máximo. As três regras que concluem "longo" não elevam a altura acima de 0,5.
- **Pontos de conferência da saída agregada:**

| z (min) | 0 | 3 | 7,5 | 15 | 30 |
|---|---|---|---|---|---|
| μ esperada | 0 | 0,2 | 0,5 | 0,5 | 0,5 |
| μ obtida | 0 | 0,2 | 0,5 | 0,5 | 0,5 |

- **Defuzzificação:** área aproximada 13,125. Centroide obtido 16,785683 min (esperado ≈ 16,785683). A tela exibe **16,79 min**.
- **Log exibido:** "R2: min(0,5000; 0,5000) = 0,5000; consequente longo recortado em 0,5000." A agregação aparece como "máximo, ponto a ponto, entre os recortes de longo, médio". O centroide aparece como "16,785683 min (exibido: 16,79 min)".

**Conclusão:** as cinco etapas conferem com a referência.

### 6.4 Simetria, alteração de regras e precisão

- **Simetria (U = 35%, T = 20 °C):** R1, R2, R4 e R5 têm h = 0,5. A saída agregada fica constante em 0,5 de 0 a 30 (mínimo e máximo da agregação: 0,5). Tempo obtido: 15,000000 min (esperado 15,00). Os recortes de curto, médio e longo cobrem o intervalo inteiro na mesma altura, então o centroide é o meio do intervalo.
- **Todas as regras com consequente curto (U = 50%, T = 25 °C):** tempo obtido 5,000111 min, exibido 5,00 (esperado ≈ 5,00). Com R5 trocada para curto, a única regra ativa passa a recortar o conjunto curto, e a saída vai de 15 para 5 minutos. Isso mostra que o resultado depende só da base de regras configurada, não de uma saída fixa.
- **Restaurar padrão:** depois do teste anterior, entradas, regras e passo voltaram a U = 35%, T = 30 °C, Δz = 0,1 e à base da seção 2.2. Calculando de novo, o resultado foi **16,79 min**.
- **Efeito do passo (U = 35%, T = 30 °C):**

| Δz (min) | N | Esperado | Obtido | Distância ao centroide contínuo (16,785714) |
|---|---|---|---|---|
| 0,1 | 300 | ≈ 16,785683 | 16,785683 | 0,0000317 |
| 0,05 | 600 | ≈ 16,785706 | 16,785706 | 0,0000079 |
| 0,01 | 3000 | ≈ 16,785714 | 16,785714 | 0,0000003 |

**Interpretação do passo.** Com duas casas, o tempo exibido é sempre 16,79 min, mas a aproximação melhora quando o passo diminui. Os pontos médios aproximam as integrais da área e do momento por retângulos, e o erro vem dos trechos inclinados da saída agregada (a rampa de 0 a 7,5 min). Ao dividir o passo por 2, o erro caiu cerca de 4 vezes (0,0000317 → 0,0000079); ao dividir por 10, caiu cerca de 100 vezes. Esse é o comportamento esperado da regra do ponto médio, cujo erro é proporcional a Δz². O custo é calcular mais pontos (300, 600 e 3000).

### 6.5 Validação da interface e determinismo

O teste foi feito no Microsoft Edge, preenchendo os campos por script como um usuário faria e clicando em **Calcular**. Em todos os casos o cálculo foi impedido: o tempo ficou "—" e **Avançar etapa** ficou desabilitado. O campo manteve o valor digitado, sem correção para o limite.

| Entrada | Mensagem exibida |
|---|---|
| U = −1% | Umidade do solo deve estar entre 0% e 100% (valor informado: -1%). |
| U = 101% | Umidade do solo deve estar entre 0% e 100% (valor informado: 101%). |
| T = 9 °C | Temperatura deve estar entre 10 °C e 40 °C (valor informado: 9 °C). |
| T = 41 °C | Temperatura deve estar entre 10 °C e 40 °C (valor informado: 41 °C). |
| Umidade vazia | Umidade do solo: o campo está vazio. |
| Texto não numérico | O campo numérico do navegador não aceita o texto, que chega vazio, e o cálculo é bloqueado ("…: o campo está vazio."). Se o navegador sinalizar entrada inválida, a mensagem é "…: digite um número válido." |

**Determinismo:**
- Calcular duas vezes a mesma configuração deu o mesmo resultado.
- Clicar em **Calcular** e percorrer as cinco etapas com **Avançar etapa** deu o mesmo tempo (16,79 min), porque as etapas só exibem o resultado já calculado.
- Trocar a regra selecionada no gráfico de implicação ou redimensionar a janela só redesenha a tela, sem recalcular nada.

**Conclusão:** entradas inválidas bloqueiam o cálculo com mensagens claras, e os resultados são determinísticos.
