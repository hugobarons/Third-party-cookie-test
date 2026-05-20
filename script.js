const resultBox = document.getElementById("result");
const cookieValue = document.getElementById("cookieValue");
const localStorageValue = document.getElementById("localStorageValue");
const queryValue = document.getElementById("queryValue");
const iframeContainer = document.getElementById("iframeContainer");

const TEST_LOCALSTORAGE_KEY = "domain1_localstorage_test";
const TEST_QUERY_PARAM = "test_id";
const DOMAIN2_ORIGIN = "https://hugo-domain-test.site";

const firstPartyBtn = document.getElementById("firstPartyBtn");
const firstPartyServerBtn = document.getElementById("firstPartyServerBtn");
const thirdPartyBtn = document.getElementById("thirdPartyBtn");
const thirdPartyServerBtn = document.getElementById("thirdPartyServerBtn");
const thirdPartyChipsBtn = document.getElementById("thirdPartyChipsBtn");
const storageAccessBtn = document.getElementById("storageAccessBtn");
const queryParamBtn = document.getElementById("queryParamBtn");
const localStorageBtn = document.getElementById("localStorageBtn");
const clearBtn = document.getElementById("clearBtn");

firstPartyBtn.addEventListener("click", runFirstPartyCookieTest);
firstPartyServerBtn.addEventListener("click", runFirstPartyServerCookieTest);
thirdPartyBtn.addEventListener("click", () => runThirdPartyIframeTest("js"));
thirdPartyServerBtn.addEventListener("click", () => runThirdPartyIframeTest("server"));
thirdPartyChipsBtn.addEventListener("click", () => runThirdPartyIframeTest("chips"));
storageAccessBtn.addEventListener("click", () => runThirdPartyIframeTest("storage-access"));
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
        "Pirmās puses document.cookie tests pabeigts." +
        `Mēģināts iestatīt: fp_cookie_js=${testId}` +
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
        const setData = await setResponse.json();

        const showResponse = await fetch("/api/show-first-cookie", {
            method: "GET",
            credentials: "same-origin"
        });
        const showData = await showResponse.json();

        setResult(
            "Pirmās puses Set-Cookie tests pabeigts." +
            `Set endpoint statuss: ${setResponse.status}` +
            `Iestatītā vērtība: ${setData.cookieValue || "(nav)"}` +
            `Show endpoint statuss: ${showResponse.status}` +
            `Serveris saņēma Cookie galveni: ${showData.receivedCookieHeader || "(nav)"}` +
            `Serveris redz fp_cookie_server: ${showData.parsedCookieValue || "(nav)"}`
        );
    } catch (error) {
        setResult(
            "Pirmās puses Set-Cookie tests neizdevās." +
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

    const modeLabels = {
        js: "document.cookie",
        server: "Set-Cookie",
        chips: "CHIPS / Partitioned Cookies",
        "storage-access": "Storage Access API"
    };

    let extraHelp = "Pārbaudiet iframe saturu, DevTools un rezultātu ziņojumu no Domain2.";
    if (mode === "storage-access") {
        extraHelp = "Ja pārlūks to pieprasa, vispirms atveriet Domain2 atsevišķā cilnē un uzspiediet 'Iestatīt Storage Access testa sīkdatni', pēc tam atgriezieties šeit un iframe iekšienē nospiediet pogu piekļuves pieprasīšanai.";
    }

    setResult(
        `Trešās puses ${modeLabels[mode] || mode} tests sākts.` +
        "Iframe no Domain2 ir ielādēts zemāk." +
        extraHelp
    );
}

function runQueryParamTest() {
    clearIframe();
    const testId = generateTestId();
    const url = new URL(window.location.href);

    url.searchParams.set(TEST_QUERY_PARAM, testId);
    window.history.pushState({}, "", url);

    setResult(
        "Vaicājuma parametru tests pabeigts." +
        `Pievienots vaicājuma parametrs: ${TEST_QUERY_PARAM}=${testId}` +
        `Pašreizējais URL: ${window.location.href}`
    );
}

function runLocalStorageTest() {
    clearIframe();
    const testId = generateTestId();
    localStorage.setItem(TEST_LOCALSTORAGE_KEY, testId);

    setResult(
        "localStorage tests pabeigts." +
        `Saglabātā atslēga: ${TEST_LOCALSTORAGE_KEY}` +
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

    const lines = [
        "Ziņa saņemta no Domain2 iframe.",
        `Scenārijs: ${data.mode || "unknown"}`,
        `Statuss: ${data.status || "unknown"}`,
        `document.cookie: ${data.cookie || "(nav)"}`,
        `Servera saņemtā Cookie galvene: ${data.receivedCookieHeader || "(nav)"}`,
        `Servera parsētā vērtība: ${data.parsedCookieValue || "(nav)"}`
    ];

    if (typeof data.hasStorageAccess !== "undefined") {
        lines.push(`hasStorageAccess: ${data.hasStorageAccess}`);
    }
    if (typeof data.requestStorageAccessSupported !== "undefined") {
        lines.push(`requestStorageAccess atbalsts: ${data.requestStorageAccessSupported}`);
    }
    if (data.requestStorageAccessResult) {
        lines.push(`requestStorageAccess rezultāts: ${data.requestStorageAccessResult}`);
    }

    setResult(lines.join(""));
}
