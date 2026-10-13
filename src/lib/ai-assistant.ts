import { VerificationResult, LandRecord } from '@/types';

export interface AIExplanationResult {
  explanationEn: string;
  explanationBn: string;
  buyerAdviceEn: string[];
  buyerAdviceBn: string[];
  discrepancyCount: number;
  engineUsed: 'gemini-model' | 'deterministic-reasoner';
}

export async function generateAIExplanation(
  record: LandRecord,
  verification: VerificationResult
): Promise<AIExplanationResult> {
  const highRisks = verification.findings.filter(f => f.severity === 'high');
  const mediumRisks = verification.findings.filter(f => f.severity === 'medium');

  // Check if external API key is present for live LLM call
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  if (apiKey && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are a Bangladeshi GovTech Land Due Diligence Assistant. Ground your answer strictly in these findings:
Location: ${record.mouza}, ${record.upazila}, ${record.district}
Current Dag: ${record.dagNo}, Khatian: ${record.khatianNo}, Area: ${record.areaDecimals} decimals.
Findings: ${JSON.stringify(verification.findings.map(f => ({ title: f.titleEn, reason: f.reasonEn })))}

Provide an objective citizen explanation in 2 concise paragraphs:
1. What the records reveal and where inconsistencies exist.
2. Concrete practical actions for the buyer before payment.
Do not claim to be a final court ruling. Return JSON with keys: explanationEn, explanationBn.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          return {
            explanationEn: parsed.explanationEn,
            explanationBn: parsed.explanationBn,
            buyerAdviceEn: verification.buyerChecklistEn,
            buyerAdviceBn: verification.buyerChecklistBn,
            discrepancyCount: verification.findings.length,
            engineUsed: 'gemini-model'
          };
        }
      }
    } catch {
      // Gracefully fall back to the deterministic natural language generator
    }
  }

  // Deterministic Grounded Reasoner (Works 100% offline without API key)
  let explanationEn = '';
  let explanationBn = '';

  if (highRisks.length > 0) {
    explanationEn = `Our automated screening flagged ${highRisks.length} urgent concern(s) regarding Dag ${record.dagNo} in ${record.mouza}. Specifically, ${highRisks.map(h => h.titleEn).join(' and ')}. Because mutation approvals or clear chain of title are unresolved, executing a purchase at this stage carries severe financial and legal risk of eviction or title contestation.`;
    explanationBn = `আমাদের স্বয়ংক্রিয় স্ক্রিনিং সিস্টেমে ${record.mouzaBn} মৌজার ${record.dagNo} নম্বর দাগে ${highRisks.length}টি জরুরি ঝুঁকি চিহ্নিত হয়েছে। বিশেষ করে, ${highRisks.map(h => h.titleBn).join(' এবং ')}। এসিল্যান্ড অফিসের হালনাগাদ নামজারি ও বায়া দলিলের বৈধতা ছাড়া এই মুহূর্তে বায়না বা ক্রয় করা অত্যন্ত ঝুঁকিপূর্ণ।`;
  } else if (mediumRisks.length > 0) {
    explanationEn = `The screening identified ${mediumRisks.length} item(s) needing clarification on Dag ${record.dagNo}. Specifically, ${mediumRisks.map(m => m.titleEn).join(', ')}. While this does not indicate outright fraud, you should independently verify boundary measurements and check the District Record Room before concluding agreements.`;
    explanationBn = `${record.dagNo} নম্বর দাগে ${mediumRisks.length}টি বিষয়ে সতর্কতামূলক পর্যালোচনা প্রয়োজন। যেমন: ${mediumRisks.map(m => m.titleBn).join(', ')}। জমি কেনার পূর্বে মৌজা নকশার সাথে সরেজমিন পরিমাপ ও জেলা রেকর্ড রুমের মূল পর্চা মিলিয়ে নেওয়া বাঞ্ছনীয়।`;
  } else {
    explanationEn = `The recorded lineage across CS, SA, RS, and BS surveys for Dag ${record.dagNo} demonstrates consistent ownership records and verified mutation status under ${record.owners[0]?.ownerName || 'the recorded owner'}. No administrative red flags or legal caveats were detected in available registries.`;
    explanationBn = `${record.mouzaBn} মৌজার ${record.dagNo} নম্বর দাগে সিএস, এসএ, আরএস ও বিএস জরিপের ধারাবাহিকতা বজায় রয়েছে এবং ${record.owners[0]?.ownerNameBn || 'রেকর্ডভুক্ত মালিকের'} নামে নামজারি সন্তোষজনক। কোনো আইনি নিষেধাজ্ঞা বা অসঙ্গতি পরিলক্ষিত হয়নি।`;
  }

  return {
    explanationEn,
    explanationBn,
    buyerAdviceEn: verification.buyerChecklistEn,
    buyerAdviceBn: verification.buyerChecklistBn,
    discrepancyCount: verification.findings.length,
    engineUsed: 'deterministic-reasoner',
  };
}
