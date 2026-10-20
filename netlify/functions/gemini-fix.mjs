import { GoogleGenAI } from "@google/genai";
export default async (request) => {
  try {
    const body=await request.json();
    const key=Netlify.env.get("GEMINI_API_KEY");
    if(!key) return Response.json({error:"GEMINI_API_KEY não configurada."},{status:500});
    const ai=new GoogleGenAI({apiKey:key});
    const r=await ai.models.generateContent({
      model:Netlify.env.get("GEMINI_MODEL")||"gemini-3.8-flash",
      contents:`Retorne SOMENTE JSON {"file":"","find":"","replace":"","reason":""}. Proponha o menor patch seguro para um erro real do jogo. Não invente arquivos. ERROS: ${JSON.stringify(body.errors||[],null,2)}`,
      config:{temperature:.05,maxOutputTokens:1400,responseMimeType:"application/json"}
    });
    return Response.json(JSON.parse(r.text));
  } catch(e) { return Response.json({error:e.message},{status:500}); }
};