document.addEventListener("DOMContentLoaded", function () {
  console.log("JavaScript carregado com sucesso!");
});
const form = document.querySelector(".form-group");
const descriptionInput = document.getElementById("description");
const code = document.getElementById("html-code");
const cssCode = document.getElementById("css-code");
form.addEventListener("submit", async function (event) {
  event.preventDefault();

  //Obter o valor digitado no campo de entrada
  const descricao = descriptionInput.value.trim();

  // exibir um indicador de carregamento enquanto a requisição está em andamento

  if (!descricao) {
    return;
  }
  mostrarCarregamento(true);
  try {
    const resposta = await fetch(
      "https://cailloufco.app.n8n.cloud/webhook/backgroundmagico",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: descricao }),
      },
    );

    if (!resposta.ok) {
      const texto = await resposta.text();
      throw new Error(`Erro ${resposta.status}: ${texto}`);
    }

    const textoResposta = await resposta.text();
    let dados;
    try {
      dados = JSON.parse(textoResposta);
    } catch (e) {
      dados = { html: textoResposta };
    }

    // Função para extrair campos comuns de html/css de respostas variadas
    function extractHtmlCss(obj) {
      let html = "";
      let css = "";

      if (!obj && !textoResposta) return { html: "", css: "" };

      // Se for string bruta
      if (typeof obj === "string") {
        const str = obj.trim();
        // extrair <style> se houver
        const styleMatch = str.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        if (styleMatch) {
          css = styleMatch[1].trim();
          html = str.replace(styleMatch[0], "").trim();
        } else {
          html = str;
        }
        return { html, css };
      }

      // Se for objeto, procurar por chaves comuns
      const tryKeys = (o, keys) => {
        for (const k of keys) {
          if (Object.prototype.hasOwnProperty.call(o, k) && o[k]) return o[k];
        }
        return undefined;
      };

      const htmlCandidates = [
        "html",
        "HTML",
        "html_code",
        "htmlCode",
        "code",
        "output",
        "result",
        "body",
        "content",
      ];
      const cssCandidates = [
        "css",
        "CSS",
        "css_code",
        "cssCode",
        "style",
        "styles",
      ];

      // procura direto
      html = tryKeys(obj, htmlCandidates) || "";
      css = tryKeys(obj, cssCandidates) || "";

      // se o objeto tem data ou result aninhado
      if ((!html || !css) && obj.data) {
        if (typeof obj.data === "string") {
          const r = extractHtmlCss(obj.data);
          html = html || r.html;
          css = css || r.css;
        } else if (Array.isArray(obj.data)) {
          for (const item of obj.data) {
            if (typeof item === "string") {
              const r = extractHtmlCss(item);
              html = html || r.html;
              css = css || r.css;
            } else if (typeof item === "object") {
              html = html || tryKeys(item, htmlCandidates) || "";
              css = css || tryKeys(item, cssCandidates) || "";
            }
            if (html && css) break;
          }
        } else if (typeof obj.data === "object") {
          html = html || tryKeys(obj.data, htmlCandidates) || "";
          css = css || tryKeys(obj.data, cssCandidates) || "";
        }
      }

      // Se ainda vazio, tentar usar qualquer string encontrada no objeto
      if (!html) {
        const findStringRecursive = (o) => {
          if (!o) return null;
          if (typeof o === "string") return o;
          if (Array.isArray(o)) {
            for (const it of o) {
              const s = findStringRecursive(it);
              if (s) return s;
            }
          } else if (typeof o === "object") {
            for (const k in o) {
              const s = findStringRecursive(o[k]);
              if (s) return s;
            }
          }
          return null;
        };
        const anyString = findStringRecursive(obj);
        if (anyString) {
          const r = extractHtmlCss(anyString);
          html = html || r.html;
          css = css || r.css;
        }
      }

      // Se html contém <style>, extrair
      if (html && /<style[^>]*>/i.test(html)) {
        const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        if (styleMatch) {
          css = css || styleMatch[1].trim();
          html = html.replace(styleMatch[0], "").trim();
        }
      }

      return { html: (html || "").toString(), css: (css || "").toString() };
    }

    const extracted = extractHtmlCss(dados);

    code.textContent = extracted.html || "Nenhum código HTML gerado.";
    cssCode.textContent = extracted.css || "Nenhum código CSS gerado.";
  } catch (error) {
    console.error("Erro ao gerar o background:", error);
    code.textContent =
      "Erro ao gerar o background. Veja o console para detalhes.";
    cssCode.textContent = "";
  } finally {
    mostrarCarregamento(false);
  }
});

function mostrarCarregamento(estaCarregando) {
  const botaoEnviar = document.getElementById("generate-btn");
  const botaoTexto = document.getElementById("btn-text");
  if (!botaoEnviar || !botaoTexto) return;
  if (estaCarregando) {
    botaoEnviar.disabled = true;
    botaoTexto.textContent = "Gerando...";
  } else {
    botaoEnviar.disabled = false;
    botaoTexto.textContent = "Gerar Background";
  }
}
