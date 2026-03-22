const resultBox = document.getElementById("result");
const cookieValue = document.getElementById("cookieValue");
const localStorageValue = document.getElementById("localStorageValue");
const queryValue = document.getElementById("queryValue");
const iframeContainer = document.getElementById("iframeContainer");

const TEST_LOCALSTORAGE_KEY = "domain1_localstorage_test";
const TEST_QUERY_PARAM = "test_id";
const DOMAIN2_ORIGIN = "https://domain2-third-party-cookie-test.huggo-barons.workers.dev";

const firstPartyBtn = document.getElementById("firstPartyBtn");
const firstPartyServerBtn = document.getElementById("firstPartyServerBtn");
const thirdPartyBtn = document.getElementById("thirdPartyBtn");
const thirdPartyServerBtn = document.getElementById("thirdPartyServerBtn");
const queryParamBtn = document.getElementById("queryParamBtn");
const localStorageBtn = document.getElementById("localStorageBtn");
const clearBtn = document.getElementById("clearBtn");

firstPartyBtn.addEventListener("click", runFirstPartyCookieTest);
firstPartyServerBtn.addEventListener("click", runFirstPartyServerCookieTest);
thirdPartyBtn.addEventListener("click", () => runThirdPartyIframeTest("js"));
thirdPartyServerBtn.addEventListener("click", () => runThirdPartyIframeTest("server"));
queryParamBtn.addEventListener("click", runQueryParamTest);
localStorageBtn.addEventListener("click", runLocalStorageTest);
clearBtn.addEventListener("click", clearTestData);

window.addEventListener("message", handleIframeMessage);
window.addEventListener("load", updateDisplayedData);

function setResult(message) {
    resultBox.textContent = message;
    updateDisplayedData();
}

function updateDisplayedData() {
    cookieValue.textContent = document.cookie || "(empty)";
    localStorageValue.textContent = localStorage.getItem(TEST_LOCALSTORAGE_KEY) || "(empty)";
    queryValue.textContent = window.location.search || "(empty)";
}

function generateTestId() {
    return "test_" + Date.now();
}

function clearIframe() {
    iframeContainer.innerHTML = "";
}

function runFirstPartyCookieTest() {
    clearIframe();
    const testId = generateTestId();

    document.cookie = `fp_cookie_js=${testId}; path=/; SameSite=Lax; Secure`;

    setResult(
        "Pirmās puses document.cookie tests pabeigts.\n" +
        `Mēģināts iestatīt: fp_cookie_js=${testId}\n` +
        `Pašreizējais document.cookie: ${document.cookie || "(empty)"}`
    );
}

async function runFirstPartyServerCookieTest() {
    clearIframe();
    const testId = generateTestId();

    try {
        const setResponse = await fetch(`/api/set-first-cookie?test_id=${encodeURIComponent(testId)}`, {
            method: "GET",
            credentials: "same-origin"
        });
        const setText = await setResponse.text();
        console.log("set-first-cookie raw response:", setText);
        const setData = JSON.parse(setText);

        const showResponse = await fetch("/api/show-first-cookie", {
            method: "GET",
            credentials: "same-origin"
        });
        const showData = await showResponse.json();

        setResult(
            "Pirmās puses Set-Cookie tests pabeigts.\n" +
            `Set endpoint statuss: ${setResponse.status}\n` +
            `Iestatītā vērtība: ${setData.cookieValue || "(nav)"}\n` +
            `Show endpoint statuss: ${showResponse.status}\n` +
            `Serveris saņēma Cookie galveni: ${showData.receivedCookieHeader || "(nav)"}\n` +
            `Serveris redz fp_cookie_server: ${showData.parsedCookieValue || "(nav)"}`
        );
    } catch (error) {
        setResult(
            "Pirmās puses Set-Cookie tests neizdevās.\n" +
            `Iemesls: ${error.message}`
        );
    }
}

function runThirdPartyIframeTest(mode) {
    clearIframe();

    const iframe = document.createElement("iframe");
    iframe.className = "test-iframe";
    iframe.src = `${DOMAIN2_ORIGIN}/thirdparty.html?mode=${encodeURIComponent(mode)}`;

    iframeContainer.appendChild(iframe);

    const modeText = mode === "server" ? "Set-Cookie" : "document.cookie";
    setResult(
        `Trešās puses ${modeText} tests sākts.\n` +
        "Iframe no Domain2 ir ielādēts zemāk.\n" +
        "Pārbaudiet iframe saturu, DevTools un rezultātu ziņojumu no Domain2."
    );
}

function runQueryParamTest() {
    clearIframe();
    const testId = generateTestId();
    const url = new URL(window.location.href);

    url.searchParams.set(TEST_QUERY_PARAM, testId);
    window.history.pushState({}, "", url);

    setResult(
        "Vaicājuma parametru tests pabeigts.\n" +
        `Pievienots vaicājuma parametrs: ${TEST_QUERY_PARAM}=${testId}\n` +
        `Pašreizējais URL: ${window.location.href}`
    );
}

function runLocalStorageTest() {
    clearIframe();
    const testId = generateTestId();
    localStorage.setItem(TEST_LOCALSTORAGE_KEY, testId);

    setResult(
        "localStorage tests pabeigts.\n" +
        `Saglabātā atslēga: ${TEST_LOCALSTORAGE_KEY}\n` +
        `Saglabātā vērtība: ${localStorage.getItem(TEST_LOCALSTORAGE_KEY)}`
    );
}

function clearTestData() {
    document.cookie = "fp_cookie_js=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "fp_cookie_server=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem(TEST_LOCALSTORAGE_KEY);

    const url = new URL(window.location.href);
    url.searchParams.delete(TEST_QUERY_PARAM);
    window.history.pushState({}, "", url);

    clearIframe();
    setResult("Testa dati notīrīti.");
}

function handleIframeMessage(event) {
    if (event.origin !== DOMAIN2_ORIGIN) {
        return;
    }

    const data = event.data;
    if (!data || typeof data !== "object") {
        return;
    }

    setResult(
        "Ziņa saņemta no Domain2 iframe.\n" +
        `Scenārijs: ${data.mode || "unknown"}\n` +
        `Statuss: ${data.status || "unknown"}\n` +
        `document.cookie: ${data.cookie || "(nav)"}\n` +
        `Servera saņemtā Cookie galvene: ${data.receivedCookieHeader || "(nav)"}\n` +
        `Servera parsētā vērtība: ${data.parsedCookieValue || "(nav)"}`
    );
}
