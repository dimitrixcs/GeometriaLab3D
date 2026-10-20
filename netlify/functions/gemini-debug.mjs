import { GoogleGenAI } from "@google/genai";
export default async (request) => {
  try {
    const body=await request.json();
    const key=Netlify.env.get("GEMINI_API_KEY");
    if(!key) return Response.json({error:"GEMINI_API_KEY não configurada no Netlify."},{status:500});
    const ai=new GoogleGenAI({apiKey:key});
    const r=await ai.models.generateContent({
      model:Netlify.env.get("GEMINI_MODEL")||"gemini-3.8-flash",
      contents:`Você é QA do jogo Geometria Lab 3D. Analise somente os erros reais abaixo e responda em português com causa provável, correção e teste.\n${JSON.stringify(body.errors||[],null,2)}`,
      config:{temperature:.1,maxOutputTokens:1200}
    });
    return Response.json({text:r.text});
  } catch(e) { return Response.json({error:e.message},{status:500}); }
};