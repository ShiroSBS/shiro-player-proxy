module.exports = async function handler(req, res) {
  const id = String(req.query.id || "");

  // Accepter uniquement un identifiant d'épisode
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).send("Identifiant invalide");
  }

  try {
    const response = await fetch(
      `https://ansembed.net/embed-${id}.html`
    );

    if (!response.ok) {
      return res.status(response.status).send(
        "Impossible de charger le lecteur Ansembed"
      );
    }

    let html = await response.text();

    // Retirer uniquement le script d'introduction Anime-Sama
    html = html.replace(
      /<script\b(?=[^>]*\bsrc\s*=\s*["'][^"']*anime-sama-intro[^"']*["'])[^>]*>\s*<\/script\s*>/gi,
      ""
    );

    // Empêcher l'appel à la fonction d'intro, par sécurité
    html = html.replace(
      /if\s*\(\s*window\.installAnimeSamaIntro\s*\)\s*window\.installAnimeSamaIntro\s*\(\s*player\s*\)\s*;?/g,
      ""
    );

    // Conserver le chargement des ressources depuis Ansembed
    const baseTag = '<base href="https://ansembed.net/">';

    if (/<base\b[^>]*>/i.test(html)) {
      html = html.replace(/<base\b[^>]*>/i, baseTag);
    } else if (/<head\b[^>]*>/i.test(html)) {
      html = html.replace(/<head\b[^>]*>/i, match =>
        `${match}\n${baseTag}`
      );
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(html);
  } catch (error) {
    console.error(error);
    return res.status(502).send("Erreur du proxy vidéo");
  }
};