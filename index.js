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

    refreshInterval = setInterval(loadMessages, REFRESH_DELAY);

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

        const response = await fetch(MESSAGES_URL);


        if (!response.ok) {
            throw new Error(
                `API error ${response.status}`
            );
        }


        const data = await response.json();


        if (!Array.isArray(data)) {
            throw new Error(
                "Invalid messages format"
            );
        }


        const oldLength = messages.length;

        messages = data;


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


    if (input === null || input === undefined) {
        return "";
    }


    input = String(input);



    const allowedTags = [
        "b",
        "strong",
        "i",
        "em",
        "u",
        "s",
        "br",
        "a",
        "img",
        "vid"
    ];



    let doc;


    try {

        doc = new DOMParser()
            .parseFromString(
                input,
                "text/html"
            );

    } catch {

        return escapeHTML(input);

    }





    function clean(node) {


        if (!node) {
            return null;
        }


        if (node.nodeType === Node.TEXT_NODE) {

            return document.createTextNode(
                node.textContent
            );

        }


        if (node.nodeType !== Node.ELEMENT_NODE) {
            return null;
        }




        const tag =
            node.tagName.toLowerCase();



        if (!allowedTags.includes(tag)) {


            const fragment =
                document.createDocumentFragment();



            [...node.childNodes].forEach(child => {

                const result = clean(child);

                if (result) {
                    fragment.appendChild(result);
                }

            });


            return fragment;

        }





        const newNode =
            document.createElement(tag);




        if (tag === "img") {


            const src =
                node.getAttribute("src");


            if (
                src &&
                src.length < 2000 &&
                /^https?:\/\//i.test(src)
            ) {

                newNode.src = src;

            }


            const width =
                node.getAttribute("width");


            if(width) {

                const w =
                    parseInt(width);


                if(
                    !isNaN(w) &&
                    w < 2000
                ) {

                    newNode.width = w;

                }

            }

        }





        if (tag === "a") {


            const href =
                node.getAttribute("href");


            if(
                href &&
                /^https?:\/\//i.test(href)
            ) {

                newNode.href = href;

            }


            newNode.target = "_blank";

        }





        [...node.childNodes].forEach(child => {

            const result = clean(child);

            if(result) {

                newNode.appendChild(result);

            }

        });



        return newNode;

    }





    const container =
        document.createElement("div");



    [...doc.body.childNodes].forEach(node => {

        const result = clean(node);

        if(result) {

            container.appendChild(result);

        }

    });



    return container.innerHTML;

}





function escapeHTML(text) {

    return String(text)
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#39;");

}





function displayMessages() {


    const container =
        document.getElementById(
            "messages-container"
        );


    if(!container) {
        return;
    }



    container.innerHTML = "";




    messages.forEach((msg,index)=>{


        if(
            !msg ||
            typeof msg !== "object"
        ) {
            return;
        }



        const element =
            document.createElement("p");



        let time = new Date();



        if(msg.time?._seconds) {

            time =
                new Date(
                    msg.time._seconds * 1000
                );

        }





        element.innerHTML = `

<strong>
${safeHTML(msg.username || "Anonymous")}
</strong>


<span style="color:#999">

-
${time.getDate().toString().padStart(2,"0")}.
${(time.getMonth()+1).toString().padStart(2,"0")}.
${time.getFullYear()}

${time.getHours().toString().padStart(2,"0")}:
${time.getMinutes().toString().padStart(2,"0")}:
${time.getSeconds().toString().padStart(2,"0")}

[${index+1}]

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
        ||
        "Anonymous";



    let message =
        document.getElementById(
            "message-inp"
        )
        ?.value.trim();




    if(!message) {
        return;
    }



    if(message.length > 5000) {

        alert(
            "Message too long"
        );

        return;

    }





    try {


        const response =
            await fetch(
                SEND_URL,
                {

                    method:"POST",

                    headers:{
                        "Content-Type":
                        "application/json"
                    },

                    body:JSON.stringify({
                        username,
                        message
                    })

                }
            );



        if(!response.ok) {

            throw new Error(
                await response.text()
            );

        }



        document.getElementById(
            "message-inp"
        ).value="";



        await loadMessages();



    } catch(error) {

        console.error(
            "Send error:",
            error
        );

    }

}






function addLink(){

    const link =
        document.getElementById("link-inp")
        .value.trim();


    const text =
        document.getElementById("prev-inp")
        .value.trim();



    document.getElementById("message-inp")
    .value +=
    `<a href="${link}" target="_blank">${text}</a>`;

}





function addImage(){

    const link =
        document.getElementById("img-link-inp")
        .value.trim();



    if(!link)
        return;



    document.getElementById("message-inp")
    .value +=
    `<img src="${link.replaceAll('"','')}" width="450">`;

}





function addReply(){

    const id =
        parseInt(
            document.getElementById("mention-inp")
            .value
        );


    const msg =
        messages[id-1];



    if(!msg)
        return;



    let text =
        String(msg.message || "");



    if(text.length > 50) {

        text =
            text.slice(0,50)
            + "...";

    }



    document.getElementById("message-inp")
    .value +=
    `~Reply to <i>${text}</i><br><br>`;

}





function switchAdvancedOptions(){

    const panel =
        document.getElementById(
            "options-panel"
        );


    if(!panel)
        return;



    panel.style.display =
        document.getElementById("adv-inp")
        .checked
        ?
        "none"
        :
        "block";

}






document.addEventListener(
"DOMContentLoaded",
()=>{

    startAutoRefresh();

});


document.addEventListener(
"keydown",
event=>{

    if(event.key==="Enter"){

        send();

    }

});