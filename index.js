let refreshInterval;
const REFRESH_DELAY = 3000;

let messages = [];

const API_URL = "https://0chan-orpin.vercel.app/api";

const MESSAGES_URL = `${API_URL}/messages`;
const SEND_URL = `${API_URL}/send`;


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


        const response = await fetch(MESSAGES_URL);


        if (!response.ok) {
            throw new Error(
                `API error: ${response.status}`
            );
        }


        messages = await response.json();


        if (oldLength !== messages.length) {

            displayMessages();


            if (
                document.getElementById("autoscroll-inp")
                ?.checked
            ) {
                window.scrollTo(
                    0,
                    document.body.scrollHeight
                );
            }

        }


    } catch(error) {

        console.error(
            "Load error:",
            error
        );

    }

}




function safeHTML(input) {

    const allowedTags = [
        "b",
        "strong",
        "i",
        "em",
        "u",
        "s",
        "br",
        "a",
        "img"
    ];


    const parser = new DOMParser();

    const doc = parser.parseFromString(
        String(input),
        "text/html"
    );


    function sanitize(node) {

        if (!node) {
            return null;
        }


        if (node.nodeType === Node.TEXT_NODE) {
            return document.createTextNode(node.textContent);
        }


        if (node.nodeType !== Node.ELEMENT_NODE) {
            return null;
        }


        const tag = node.tagName.toLowerCase();


        // Если тег запрещён — оставляем только текст/детей
        if (!allowedTags.includes(tag)) {

            const fragment =
                document.createDocumentFragment();


            for (const child of [...node.childNodes]) {

                const cleanChild =
                    sanitize(child);

                if (cleanChild) {
                    fragment.appendChild(cleanChild);
                }

            }


            return fragment;

        }


        const newNode =
            document.createElement(tag);



        // Разрешённые атрибуты
        if (tag === "img") {

            const src =
                node.getAttribute("src");

            if (src) {

                newNode.setAttribute(
                    "src",
                    src
                );

            }


            const width =
                node.getAttribute("width");

            if (width) {

                newNode.setAttribute(
                    "width",
                    width
                );

            }

        }


        if (tag === "a") {

            const href =
                node.getAttribute("href");


            if (href) {

                newNode.setAttribute(
                    "href",
                    href
                );

            }


            newNode.setAttribute(
                "target",
                "_blank"
            );

        }



        for (const child of [...node.childNodes]) {

            const cleanChild =
                sanitize(child);


            if (cleanChild) {

                newNode.appendChild(
                    cleanChild
                );

            }

        }


        return newNode;

    }



    const container =
        document.createElement("div");


    for (const child of [...doc.body.childNodes]) {

        const clean =
            sanitize(child);


        if (clean) {

            container.appendChild(clean);

        }

    }


    return container.innerHTML;

}



function displayMessages() {


    const container =
        document.getElementById(
            "messages-container"
        )
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

        } else {

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
                .padStart(2, "0")}.
            ${(time.getMonth() + 1)
                .toString()
                .padStart(2, "0")}.
            ${time.getFullYear()}


            ${time.getHours()
                .toString()
                .padStart(2, "0")}:
            ${time.getMinutes()
                .toString()
                .padStart(2, "0")}:
            ${time.getSeconds()
                .toString()
                .padStart(2, "0")}


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
        document.getElementById(
            "username-inp"
        )
        ?.value.trim()
        || "Anonymous";



    const message =
        document.getElementById(
            "message-inp"
        )
        ?.value.trim();



    if (!message) {
        return;
    }



    try {


        const response = await fetch(
            SEND_URL,
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },


                body: JSON.stringify({

                    username,
                    message

                })

            }
        );



        if (!response.ok) {

            throw new Error(
                `Send error: ${response.status}`
            );

        }



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


        if (event.key === "Enter") {


            if (
                event.target.tagName !== "INPUT" &&
                event.target.tagName !== "TEXTAREA"
            ) {

                event.preventDefault();

            }


            send();


        }


    }
);
function addLink(){

    const link =
        document.getElementById("link-inp").value;

    const preview =
        document.getElementById("prev-inp").value;


    document.getElementById("message-inp").value +=
        `<a href="${link}" target="_blank">${preview}</a>`;

}



function addImage(){

    const link =
        document.getElementById("img-link-inp").value;


    document.getElementById("message-inp").value +=
        `<img src="${link}" width="450">`;

}



function addReply(){

    const id =
        parseInt(
            document.getElementById("mention-inp").value
        );


    const msg = messages[id - 1];


    if(!msg)
        return;


    let text = msg.message;


    if(text.length > 50){
        text = text.slice(0,50) + "...";
    }


    document.getElementById("message-inp").value +=
        `~Reply to <i>${text}</i><br><br>`;

}



function switchAdvancedOptions(){

    const panel =
        document.getElementById("options-panel");


    const checked =
        document.getElementById("adv-inp").checked;


    if(checked){

        panel.style.display = "none";

    } else {

        panel.style.display = "block";

    }

}