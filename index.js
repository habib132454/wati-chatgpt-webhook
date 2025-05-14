const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WATI_API_KEY = process.env.WATI_API_KEY;

app.post("/", async (req, res) => {
  try {
    const userMessage = req.body.message || req.body.text || "";
    const phoneNumber = req.body.waId || req.body.phone;

    console.log("📩 요청 본문:", req.body);
    console.log("📞 사용자 번호:", phoneNumber);
    console.log("💬 사용자 메시지:", userMessage);

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "너는 얄라코리아 상담 매니저야. 손님이 한국 여행이나 병원, 피부과에 대해 묻는다면 정중하고 따뜻하게 아랍어로 응답해줘.",
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.choices[0].message.content;
    console.log("🤖 ChatGPT 응답:", reply);

    if (phoneNumber && reply) {
      const watiRes = await axios.post(
        "https://live-server.wati.io/api/v1/sendSessionMessage",
        {
          phone: phoneNumber,
          message: reply,
        },
        {
          headers: {
            Authorization: `Bearer ${WATI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("📤 WATI 응답 전송 성공:", watiRes.data);
    } else {
      console.warn("⚠️ 전화번호 또는 응답 없음. 전송 생략");
    }

    res.status(200).json({ reply });
  } catch (err) {
    console.error("❌ 에러 발생:", err.message);
    res.status(500).send("서버 오류");
  }
});

app.get("/", (req, res) => {
  res.send("WATI - ChatGPT Webhook is running ✅");
});

module.exports = app;