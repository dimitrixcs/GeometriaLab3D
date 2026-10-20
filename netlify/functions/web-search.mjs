export default async (request) => {
  const q = new URL(request.url).searchParams.get("q") || "geometria";
  try {
    const api = "https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch="
      + encodeURIComponent(q) + "&format=json&utf8=1&origin=*";
    const r = await fetch(api);
    if (!r.ok) return Response.json({error:"Falha na pesquisa web."},{status:502});
    const data = await r.json();
    const results=(data.query?.search||[]).slice(0,8).map(x=>({
      title:x.title,
      snippet:String(x.snippet||"").replace(/<[^>]+>/g,""),
      url:"https://pt.wikipedia.org/wiki/"+encodeURIComponent(x.title.replaceAll(" ","_"))
    }));
    return Response.json({results});
  } catch(e) {
    return Response.json({error:e.message},{status:500});
  }
};