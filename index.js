let refreshInterval;
const REFRESH_DELAY = 3000;

let messages = [];

const API_URL = "https://0chan-orpin.vercel.app/api";



function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }

    refreshInterval = setInterval(() => {
        loadMessages();
    }, REFRESH_DELAY);

    loadMessages();
}


function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}


async function loadMessages() {
    try {
        const oldLength = messages.length;

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("API error");
        }

        messages = await response.json();

        if (oldLength < messages.length) {
            displayMessages();

            if (document.getElementById("autoscroll-inp")?.checked) {
                window.scrollTo(
                    0,
                    document.body.scrollHeight
                );
            }
        }

    } catch (error) {
        console.error("Load error:", error);
    }
}


function safeHTML(input) {
    return String(input)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}


function displayMessages() {

    const container =
        document.getElementById("messages-container")
        || document.body;


    container.innerHTML = "";


    messages.forEach((msg, index) => {

        const element =
            document.createElement("p");


        let time;


        if (msg.time?._seconds) {
            time = new Date(
                msg.time._seconds * 1000
            );
        }
        else {
            time = new Date();
        }


        element.innerHTML = `
            <strong>
                ${safeHTML(msg.username)}
            </strong>

            <span style="color:#999">
            -
            ${time.getDate()
                .toString()
                .padStart(2,"0")}.
            ${(time.getMonth()+1)
                .toString()
                .padStart(2,"0")}.
            ${time.getFullYear()}

            ${time.getHours()
                .toString()
                .padStart(2,"0")}:
            ${time.getMinutes()
                .toString()
                .padStart(2,"0")}:
            ${time.getSeconds()
                .toString()
                .padStart(2,"0")}

            [${index + 1}]
            </span>

            <br>

            ${safeHTML(msg.message)}
        `;


        container.appendChild(element);

    });
}



async function send() {

    const username =
        document.getElementById("username-inp")
        ?.value.trim()
        || "Anonymous";


    const message =
        document.getElementById("message-inp")
        ?.value.trim();


    if (!message)
        return;



    try {

        await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                username,
                message

            })

        });


        document.getElementById(
            "message-inp"
        ).value = "";


        await loadMessages();


    } catch(error) {

        console.error(
            "Send error:",
            error
        );

    }

}



document.addEventListener(
    "DOMContentLoaded",
    () => {

        startAutoRefresh();

    }
);



document.addEventListener(
    "keydown",
    event => {

        if(event.key === "Enter") {

            if(
                event.target.tagName !== "TEXTAREA"
                &&
                event.target.tagName !== "INPUT"
            ) {
                event.preventDefault();
            }

            send();

        }

    }
);
