const charNameInput = document.getElementById("char-name");
const charImageInput = document.getElementById("char-image");
const charPreview = document.getElementById("char-preview");
const result = document.getElementById("result");

const API_KEY = "3a35ea896de84e658b3131439252811";

charImageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    charPreview.innerHTML = `<img src="${reader.result}">`;
  };
  reader.readAsDataURL(file);
});

document.getElementById("check-weather").addEventListener("click", async () => {
  const city = document.getElementById("city").value.trim();
  if (!city) return alert("도시명을 입력하세요!");

  const msgCold = document.getElementById("msg-cold").value;
  const msgCool = document.getElementById("msg-cool").value;
  const msgWarm = document.getElementById("msg-warm").value;
  const msgHot  = document.getElementById("msg-hot").value;
  const msgRain = document.getElementById("msg-rain").value;

  const charName = charNameInput.value || "캐릭터";

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=kr`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const temp = data.main.temp;
    const feels = data.main.feels_like;
    const weatherMain = data.weather[0].main.toLowerCase();
    const desc = data.weather[0].description;

    let selectedMessage = "";

    if (weatherMain.includes("rain")) selectedMessage = msgRain;
    else if (temp < 5) selectedMessage = msgCold;
    else if (temp < 15) selectedMessage = msgCool;
    else if (temp < 23) selectedMessage = msgWarm;
    else selectedMessage = msgHot;

    const charHtml = charPreview.innerHTML || "👤";

    result.innerHTML = `
      <div class="card">
        ${charHtml}
        <div class="bubble">
          <strong>${charName}의 한마디</strong><br>
          ${selectedMessage}
          <div class="caption">
            현재 ${city} 기온은 ${temp}°C (체감 ${feels}°C), 날씨: ${desc}
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    alert("날씨 정보를 가져오지 못했어요.");
  }
});
