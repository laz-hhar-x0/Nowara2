// وظائف التنقل
function openStatsPage() {
    saveInputValue();
    window.location.href = "stats.html";
}

function openTipsPage() {
    saveInputValue();
    window.location.href = "tips.html";
}

function saveInputValue() {
    const waterInput = document.getElementById('waterInput');
    if (waterInput && waterInput.value) {
        localStorage.setItem('waterInputValue', waterInput.value);
    }
}

const tips = [
    "قم بالسقي في الصباح الباكر أو في المساء لتفادي تبخر الماء",
    "استخدم نظام الري بالتنقيط لتوفير المياه",
    "تأكد من عدم وجود تسرب في أنابيب الري",
    "نظف فلاتر النظام بانتظام لضمان كفاءة الري",
    "اضبط كمية الماء حسب نوع النبات واحتياجاته",
    "استخدم حساسات الرطوبة لتحسين كفاءة الري",
    "افصل النظام عند هطول الأمطار لتوفير المياه",
    "قم بصيانة النظام قبل بدء موسم الري",
    "قسم الحديقة إلى مناطق حسب احتياجاتها المائية",
    "استخدم مياه الأمطار المجمعة لري النباتات"
];

let currentTipIndex = 0;
let tipInterval;

function showTip() {
    const tipContainer = document.getElementById('tipContainer');
    const tipContent = document.getElementById('tipContent');

    if (tipContainer && tipContent) {
        tipContent.textContent = tips[currentTipIndex];
        tipContainer.style.display = 'block';
        setTimeout(() => tipContainer.style.display = 'none', 4000);
        currentTipIndex = (currentTipIndex + 1) % tips.length;

        if (document.visibilityState !== 'visible') {
            sendNotification(tips[currentTipIndex]);
        }
    }
}

function sendNotification(tip) {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('نصيحة الري', {
                    body: tip,
                    icon: 'icon.png'
                });
            }
        });
    }
}

// إعداد Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDIW0KnO1U98iOiMcVJ3lW2yAvzuNQJvVw",
    authDomain: "sokiaa-7129a.firebaseapp.com",
    databaseURL: "https://sokiaa-7129a-default-rtdb.firebaseio.com",
    projectId: "sokiaa-7129a",
    storageBucket: "sokiaa-7129a.firebasestorage.app",
    messagingSenderId: "237882065921",
    appId: "1:237882065921:web:f27fae5fa3ed6969832c00",
    measurementId: "G-WGTM3Z2KWV"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    const waterInput = document.getElementById('waterInput');
    const savedValue = localStorage.getItem('waterInputValue');
    if (waterInput && savedValue) {
        waterInput.value = savedValue;
        document.querySelector('.water-level').innerHTML =
            `${parseFloat(savedValue).toFixed(1)}<span style="margin-left: 3px;">L</span>`;
    }

    const powerBtn = document.getElementById("powerBtn");
    const powerImg = document.getElementById("powerImg");
    const powerText = document.getElementById("powerText");
    const autoIcon = document.getElementById("autoIcon");
    const autoImg = document.getElementById("autoImg");
    const autoText = document.getElementById("autoText");
    const waterLevel = document.querySelector(".water-level");

    let isAuto = false;
    let isWaterOn = false;

    function updateUI() {
        powerImg.src = isWaterOn ? "power-red.png" : "power-green.png";
        powerText.textContent = isWaterOn ? "إيقاف" : "تشغيل";
        autoImg.src = isAuto ? "autoBlack.png" : "autoBlue.png";
        autoText.style.color = isAuto ? "black" : "blue";
        waterInput.disabled = isWaterOn;
    }

    waterInput.addEventListener('input', () => {
        const waterValue = parseFloat(waterInput.value);
        if (!isNaN(waterValue) && waterValue >= 0) {
            waterLevel.innerHTML = `${waterValue.toFixed(1)}<span style="margin-left: 3px;">L</span>`;
            localStorage.setItem('waterInputValue', waterValue);
            if (isWaterOn) {
                db.ref("system/totalInput").set(waterValue);
            }
        }
    });

    autoIcon.addEventListener("click", () => {
        isAuto = !isAuto;
        updateUI();
        db.ref("system/mode").set(isAuto ? "Auto" : "Manual");
    });

    powerBtn.addEventListener("click", () => {
        if (isWaterOn) {
            isWaterOn = false;
            updateUI();
            db.ref("system").update({ isWaterOn: false });
        } else {
            const waterValue = parseFloat(waterInput.value);
              if (isNaN(waterValue)) {
                    alert("رجاءً أدخل قيمة صالحة للماء");
                    return;
                }

            isWaterOn = true;
            updateUI();
            db.ref("system").update({
                isWaterOn: true,
                totalInput: waterValue
            });
        }
    });


    db.ref("system").on("value", (snapshot) => {
        const systemData = snapshot.val();
        if (systemData) {
            isWaterOn = systemData.isWaterOn || false;
            isAuto = systemData.mode === "Auto";
            updateUI();

            if (systemData.totalInput !== undefined) {
                waterLevel.innerHTML = `${systemData.totalInput.toFixed(1)}<span style="margin-left: 3px;">L</span>`;
                if (!waterInput.value && systemData.totalInput > 0) {
                    waterInput.value = systemData.totalInput;
                    localStorage.setItem("waterInputValue", systemData.totalInput);
                }
            }
        }
    });

    db.ref("system").once("value").then((snapshot) => {
        if (!snapshot.exists()) {
            db.ref("system").set({
                isWaterOn: false,
                mode: "Manual",
                totalInput: 0,
                zones: {
                    "1": { name: "المنطقة 1", hasLeak: false, waterConsumed: 0 },
                    "2": { name: "المنطقة 2", hasLeak: false, waterConsumed: 0 },
                    "3": { name: "المنطقة 3", hasLeak: false, waterConsumed: 0 },
                    "4": { name: "المنطقة 4", hasLeak: false, waterConsumed: 0 }
                }
            });
        }
    });

    // 👇 هذا هو الكود الإضافي الخاص بالمناطق (zones)
    const zonesElements = document.querySelectorAll('.zone');
    db.ref("system/zones").on("value", (snapshot) => {
        const zonesData = snapshot.val();
        if (zonesData) {
          zonesElements.forEach((el, index) => {
                const zoneKey = (index + 1).toString();
                const zone = zonesData[zoneKey];
                if (zone) {
                    el.innerHTML = `${zone.hasLeak ? '❌' : '✅'} <br> ${zone.name}`;

                    if (zone.hasLeak) {
                        el.style.borderTop = "4px solid red";
                        el.style.borderBottom = "4px solid red";
                        el.style.color = "red";
                    } else {
                        el.style.borderTop = "4px solid rgb(34, 212, 34)";
                        el.style.borderBottom = "none"; // أو نفس اللون لو تحب تظهره دايم
                        el.style.color = "#ddd";
                    }
                }
            });
        }
    });

    showTip();
    tipInterval = setInterval(showTip, 10000);
});
