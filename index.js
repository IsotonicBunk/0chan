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




function safeHTML(input){

    const allowed =
        [
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


    const parser =
        new DOMParser();


    const doc =
        parser.parseFromString(
            input,
            "text/html"
        );


    function clean(node){


        if(node.nodeType === Node.TEXT_NODE){
            return;
        }


        if(node.nodeType === Node.ELEMENT_NODE){


            const tag =
                node.tagName.toLowerCase();


            if(!allowed.includes(tag)){


                const parent =
                    node.parentNode;


                while(node.firstChild){
                    parent.insertBefore(
                        node.firstChild,
                        node
                    );
                }


                parent.removeChild(node);

                return;

            }



            for(
                const attr of [...node.attributes]
            ){

                if(
                    tag === "img" &&
                    attr.name === "src"
                ){
                    continue;
                }


                if(
                    tag === "a" &&
                    (
                        attr.name === "href" ||
                        attr.name === "target"
                    )
                ){
                    continue;
                }


                node.removeAttribute(attr.name);

            }


        }


        for(
            const child of [...node.childNodes]
        ){
            clean(child);
        }

    }


    clean(doc.body);


    return doc.body.innerHTML;

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