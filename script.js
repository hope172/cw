alert("DEBUG: 새 script.js가 로드되었습니다.");

// ===== 공통 DOM =====
const charNameInput = document.getElementById("char-name");
const charImageInput = document.getElementById("char-image");
const charPreview = document.getElementById("char-preview");
const result = document.getElementById("result");

// ===== 캐릭터 이미지 미리보기 =====
charImageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    charPreview.innerHTML = `<img src="${reader.result}">`;
  };
  reader.readAsDataURL(file);
});

// ===== 한국 광역지역 → 위도/경도 매핑 =====
const REGION_COORDS = {
  "Seoul": { lat: 37.5665, lon: 126.9780 },
  "Incheon": { lat: 37.4563, lon: 126.7052 },
  "Busan": { lat: 35.1796, lon: 129.0756 },
  "Daegu": { lat: 35.8714, lon: 128.6014 },
  "Gwangju": { lat: 35.1595, lon: 126.8526 },
  "Daejeon": { lat: 36.3504, lon: 127.3845 },
  "Ulsan": { lat: 35.5384, lon: 129.3114 },

  "Gyeonggi-do": { lat: 37.2752, lon: 127.0095 },
  "Gangwon-do": { lat: 37.8820, lon: 127.7310 },
  "Chungcheongbuk-do": { lat: 36.6357, lon: 127.4913 },
  "Chungcheongnam-do": { lat: 36.6588, lon: 126.6739 },
  "Jeollabuk-do": { lat: 35.7175, lon: 127.1530 },
  "Jeollanam-do": { lat: 34.8161, lon: 126.4630 },
  "Gyeongsangbuk-do": { lat: 36.4919, lon: 128.8889 },
  "Gyeongsangnam-do": { lat: 35.2383, lon: 128.6924 },

  "Jeju-do": { lat: 33.4996, lon: 126.5312 }
};

// ===== Open-Meteo 호출 =====
async function fetchWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Asia%2FSeoul`;

  console.log("[Open-Meteo 요청 URL]", url);

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    console.error("Open-Meteo 응답 오류:", res.status, text);
    throw new Error("Open-Meteo 응답 오류: " + res.status);
  }

  const data = await res.json();
  console.log("[Open-Meteo 응답 데이터]", data);

  if (!data.current_weather) {
    console.error("current_weather 필드가 없습니다.", data);
    throw new Error("날씨 데이터에 current_weather가 없습니다.");
  }

  return data.current_weather; // {temperature, weathercode, ...}
}

// ===== 날씨 코드 → 한글 설명 =====
function weatherCodeToKr(code) {
  const map = {
    0: "맑음",
    1: "대체로 맑음",
    2: "부분적으로 흐림",
    3: "흐림",
    45: "안개",
    48: "안개(서리)",
    51: "이슬비",
    53: "이슬비",
    55: "이슬비",
    56: "얼어붙는 이슬비",
    57: "강한 얼어붙는 이슬비",
    61: "약한 비",
    63: "보통 비",
    65: "강한 비",
    66: "얼어붙는 비",
    67: "강한 얼어붙는 비",
    71: "약한 눈",
    73: "보통 눈",
    75: "강한 눈",
    80: "약한 소나기",
    81: "보통 소나기",
    82: "강한 소나기",
    95: "천둥번개",
    96: "천둥번개 + 약한 우박",
    99: "천둥번개 + 강한 우박"
  };
  return map[code] || "알 수 없는 날씨";
}

// ===== 메인 버튼 클릭 =====
document.getElementById("check-weather").addEventListener("click", async () => {
  const citySelect = document.getElementById("city");
  const regionKey = citySelect.value;
  const regionNameKr = citySelect.options[citySelect.selectedIndex]?.textContent;

  if (!regionKey) {
    alert("지역을 선택해주세요!");
    return;
  }

  const coords = REGION_COORDS[regionKey];
  const { lat, lon } = coords;

  const msgCold = document.getElementById("msg-cold").value.trim();
  const msgCool = document.getElementById("msg-cool").value.trim();
  const msgWarm = document.getElementById("msg-warm").value.trim();
  const msgHot  = document.getElementById("msg-hot").value.trim();
  const msgRain = document.getElementById("msg-rain").value.trim();

  const charName = (charNameInput.value || "캐릭터").trim();
  const charHtml = charPreview.innerHTML || "👤";

  let temp, desc, code, isRain;

  try {
    const weather = await fetchWeather(lat, lon);
    temp = weather.temperature;
    code = weather.weathercode;
    desc = weatherCodeToKr(code);

    // 비 관련 코드 (이슬비/비/소나기)
    isRain = (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
  } catch (err) {
    console.error("실제 날씨 호출 실패:", err);

    // 🔸 여기가 핵심: 실패해도 카드가 뜨게 하기 위한 '임시 데이터'
    temp = 20;               // 임의의 온도
    desc = "날씨 정보 불러오기 실패(네트워크 또는 환경 문제)";
    isRain = false;
    
    alert("날씨 정보를 불러오지 못했습니다.\n\n" +
          "원인: " + err.message + "\n" +
          "그래도 캐릭터 알림 카드는 임시 데이터로 보여줄게요.");
  }

  // 여기부터는 성공/실패 상관없이 공통으로 카드 생성
  let selectedMessage = "";
  if (isRain && msgRain) selectedMessage = msgRain;
  else if (temp < 5 && msgCold) selectedMessage = msgCold;
  else if (temp < 15 && msgCool) selectedMessage = msgCool;
  else if (temp < 23 && msgWarm) selectedMessage = msgWarm;
  else selectedMessage = msgHot || "오늘도 우리 잘 버텨보자!";

  result.classList.remove("result-empty");
  result.innerHTML = `
    <div class="card">
      <div class="card-inner">
        <div class="char-face">
          ${charHtml}
        </div>
        <div class="bubble">
          <div class="bubble-name">${charName}의 한마디</div>
          <div class="bubble-text">${selectedMessage}</div>
          <div class="caption">
            현재 ${regionNameKr} 기준 기온은 대략 ${temp}°C (실제 값이 아닐 수 있습니다)<br>
            날씨: ${desc}
          </div>
        </div>
      </div>
    </div>
  `;
});

