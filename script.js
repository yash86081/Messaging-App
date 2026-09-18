const SUPABASE_URL =
    "https://nmlhudteeetfaucncgdc.supabase.co"

const SUPABASE_KEY =
    "sb_publishable_bfBMrwL2YDj53tbPxxu-Ow_bykMyc-h"


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    )



/* =========================
   ELEMENTS
========================= */

const LoadingScreen =
    document.getElementById("LoadingScreen")

const LoadingText =
    document.getElementById("LoadingText")

const LoadingProgress =
    document.getElementById("LoadingProgress")


const Auth =
    document.getElementById("Auth")

const ChatApp =
    document.getElementById("ChatApp")


const SignupPage =
    document.getElementById("SignupPage")

const LoginPage =
    document.getElementById("LoginPage")


const Username =
    document.getElementById("Username")

const Email =
    document.getElementById("Email")

const Password =
    document.getElementById("Password")


const LoginEmail =
    document.getElementById("LoginEmail")

const LoginPassword =
    document.getElementById("LoginPassword")


const Signup =
    document.getElementById("Signup")

const Login =
    document.getElementById("Login")


const ShowLogin =
    document.getElementById("ShowLogin")

const ShowSignup =
    document.getElementById("ShowSignup")


const UserList =
    document.getElementById("UserList")


const ChatTitle =
    document.getElementById("ChatTitle")

const ChatAvatar =
    document.getElementById("ChatAvatar")


const Messages =
    document.getElementById("Messages")


const Input =
    document.getElementById("Input")

const Send =
    document.getElementById("Send")


const Logout =
    document.getElementById("Logout")


const SettingsButton =
    document.getElementById("SettingsButton")

const SettingsPanel =
    document.getElementById("SettingsPanel")

const CloseSettings =
    document.getElementById("CloseSettings")


const AvatarFile =
    document.getElementById("AvatarFile")

const UploadAvatar =
    document.getElementById("UploadAvatar")


const StickerFile =
    document.getElementById("StickerFile")

const UploadSticker =
    document.getElementById("UploadSticker")


const StickerButton =
    document.getElementById("StickerButton")

const StickerPanel =
    document.getElementById("StickerPanel")


const ReplyBar =
    document.getElementById("ReplyBar")

const ReplyName =
    document.getElementById("ReplyName")

const ReplyText =
    document.getElementById("ReplyText")

const CancelReply =
    document.getElementById("CancelReply")


const TypingIndicator =
    document.getElementById("TypingIndicator")



/* =========================
   VARIABLES
========================= */

let CurrentChatUser = null

let CurrentUser = null

let ReplyingTo = null

let UsersLoaded = false

let StickersLoaded = false

let LoadingFinished = false



/* =========================
   LOADING SCREEN
========================= */

function SetLoading(text, progress) {

    LoadingText.textContent = text

    LoadingProgress.style.width =
        progress + "%"

}


function HideLoading() {

    LoadingScreen.style.display = "none"

    LoadingFinished = true

}



/* =========================
   PAGE SWITCHING
========================= */

ShowLogin.addEventListener(
    "click",
    function() {

        SignupPage.style.display = "none"

        LoginPage.style.display = "block"

    }
)


ShowSignup.addEventListener(
    "click",
    function() {

        LoginPage.style.display = "none"

        SignupPage.style.display = "block"

    }
)



/* =========================
   SIGN UP
========================= */

Signup.addEventListener(
    "click",
    async function() {

        if (
            Username.value.trim() === "" ||
            Email.value.trim() === "" ||
            Password.value === ""
        ) {

            alert("Fill everything in.")

            return

        }


        const {
            data,
            error
        } =
        await supabaseClient.auth.signUp({

            email: Email.value.trim(),

            password: Password.value

        })


        if (error) {

            alert(error.message)

            return

        }


        const user = data.user


        if (!user) {

            alert("Account creation failed.")

            return

        }


        const {
            error: profileError
        } =
        await supabaseClient
            .from("profiles")
            .insert({

                id: user.id,

                username:
                    Username.value.trim()

            })


        if (profileError) {

            console.log(profileError)

            alert(
                "Account created, but profile failed."
            )

            return

        }


        await CheckUser()

    }
)



/* =========================
   LOGIN
========================= */

Login.addEventListener(
    "click",
    async function() {

        const {
            error
        } =
        await supabaseClient.auth.signInWithPassword({

            email:
                LoginEmail.value.trim(),

            password:
                LoginPassword.value

        })


        if (error) {

            alert(error.message)

            return

        }


        await CheckUser()

    }
)



/* =========================
   CHECK USER
========================= */

async function CheckUser() {

    SetLoading(
        "Checking account...",
        25
    )


    const {
        data,
        error
    } =
    await supabaseClient.auth.getUser()


    if (error) {

        console.log(error.message)

    }


    CurrentUser = data.user


    if (CurrentUser) {

        Auth.style.display = "none"

        ChatApp.style.display = "block"


        SetLoading(
            "Loading chats...",
            55
        )


        await LoadUsers()


        SetLoading(
            "Loading stickers...",
            80
        )


        await LoadStickers()


        SetLoading(
            "Ready!",
            100
        )


        setTimeout(
            HideLoading,
            150
        )


    } else {

        Auth.style.display = "flex"

        ChatApp.style.display = "none"

        HideLoading()

    }

}



/* =========================
   LOAD USERS
========================= */

async function LoadUsers() {

    const {
        data,
        error
    } =
    await supabaseClient
        .from("profiles")
        .select(
            "id, username, avatar_url"
        )
        .order(
            "username",
            {
                ascending: true
            }
        )


    if (error) {

        console.log(error.message)

        return

    }


    /*
       IMPORTANT:

       Clear the list BEFORE adding users.

       This fixes the duplicate chat-list bug.
    */

    UserList.replaceChildren()


    const seenUsers =
        new Set()


    for (const user of data) {

        if (
            user.id === CurrentUser.id
        ) {

            continue

        }


        if (
            seenUsers.has(user.id)
        ) {

            continue

        }


        seenUsers.add(user.id)


        const person =
            document.createElement("div")

        person.classList.add(
            "UserItem"
        )


        const avatar =
            document.createElement("img")

        avatar.classList.add(
            "UserAvatar"
        )


        avatar.src =
            user.avatar_url ||
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3C/svg%3E"


        const name =
            document.createElement("span")

        name.textContent =
            user.username


        person.appendChild(avatar)

        person.appendChild(name)


        person.addEventListener(
            "click",
            function() {

                OpenChat(user)

            }
        )


        UserList.appendChild(person)

    }


    UsersLoaded = true

}



/* =========================
   OPEN CHAT
========================= */

async function OpenChat(user) {

    CurrentChatUser = user

    ChatTitle.textContent =
        user.username


    ChatAvatar.src =
        user.avatar_url ||
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3C/svg%3E"


    TypingIndicator.textContent = ""


    CancelReplyFunction()


    await LoadMessages()

    await MarkChatRead()

}



/* =========================
   LOAD MESSAGES
========================= */

async function LoadMessages() {

    if (!CurrentChatUser) {

        return

    }


    const {
        data,
        error
    } =
    await supabaseClient
        .from("messages")
        .select("*")
        .or(
            "and(sender_id.eq." +
            CurrentUser.id +
            ",receiver_id.eq." +
            CurrentChatUser.id +
            ")," +
            "and(sender_id.eq." +
            CurrentChatUser.id +
            ",receiver_id.eq." +
            CurrentUser.id +
            ")"
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        )


    if (error) {

        console.log(error.message)

        return

    }


    Messages.replaceChildren()


    if (data.length === 0) {

        const empty =
            document.createElement("p")

        empty.textContent =
            "No messages yet."

        empty.id =
            "EmptyChat"

        Messages.appendChild(empty)

        return

    }


    for (const item of data) {

        CreateMessageElement(item)

    }


    ScrollToBottom()

}



/* =========================
   CREATE MESSAGE
========================= */

function CreateMessageElement(item) {

    const messageBox =
        document.createElement("div")

    messageBox.classList.add(
        "MessageBox"
    )


    if (
        item.sender_id ===
        CurrentUser.id
    ) {

        messageBox.classList.add(
            "Sent"
        )

    } else {

        messageBox.classList.add(
            "Received"
        )

    }


    const senderName =
        document.createElement("p")

    senderName.classList.add(
        "SenderName"
    )


    if (
        item.sender_id ===
        CurrentUser.id
    ) {

        senderName.textContent =
            "You"

    } else {

        senderName.textContent =
            CurrentChatUser.username

    }


    messageBox.appendChild(
        senderName
    )


    /* =========================
       REPLY PREVIEW
    ========================= */

    if (item.reply_to) {

        const reply =
            document.createElement("div")

        reply.classList.add(
            "ReplyPreview"
        )

        reply.textContent =
            "Reply"

        messageBox.appendChild(
            reply
        )

    }


    /* =========================
       MESSAGE CONTENT
    ========================= */

    const message =
        document.createElement("div")

    message.classList.add(
        "Message"
    )


    if (
        item.content.startsWith(
            "STICKER:"
        )
    ) {

        const image =
            document.createElement("img")

        image.classList.add(
            "StickerMessage"
        )

        image.src =
            item.content.substring(
                8
            )

        message.appendChild(
            image
        )

    } else {

        message.textContent =
            item.content

    }


    messageBox.appendChild(
        message
    )


    /* =========================
       EDITED
    ========================= */

    if (item.edited) {

        const edited =
            document.createElement("span")

        edited.classList.add(
            "Edited"
        )

        edited.textContent =
            "(edited)"

        message.appendChild(
            edited
        )

    }


    /* =========================
       OWN MESSAGE ACTIONS
    ========================= */

    if (
        item.sender_id ===
        CurrentUser.id
    ) {

        const actions =
            document.createElement("div")

        actions.classList.add(
            "MessageActions"
        )


        const replyButton =
            document.createElement("button")

        replyButton.textContent =
            "↩"

        replyButton.addEventListener(
            "click",
            function() {

                StartReply(item)

            }
        )


        const editButton =
            document.createElement("button")

        editButton.textContent =
            "Edit"

        editButton.addEventListener(
            "click",
            function() {

                EditMessage(item)

            }
        )


        const deleteButton =
            document.createElement("button")

        deleteButton.textContent =
            "Delete"

        deleteButton.addEventListener(
            "click",
            function() {

                DeleteMessage(item)

            }
        )


        actions.appendChild(
            replyButton
        )

        actions.appendChild(
            editButton
        )

        actions.appendChild(
            deleteButton
        )


        messageBox.appendChild(
            actions
        )

    } else {

        const actions =
            document.createElement("div")

        actions.classList.add(
            "MessageActions"
        )


        const replyButton =
            document.createElement("button")

        replyButton.textContent =
            "↩"

        replyButton.addEventListener(
            "click",
            function() {

                StartReply(item)

            }
        )


        actions.appendChild(
            replyButton
        )


        messageBox.appendChild(
            actions
        )

    }


    Messages.appendChild(
        messageBox
    )

}



/* =========================
   SEND MESSAGE
========================= */

Send.addEventListener(
    "click",
    SendMessage
)


async function SendMessage() {

    if (!CurrentChatUser) {

        alert("Select a chat first.")

        return

    }


    const text =
        Input.value.trim()


    if (text === "") {

        return

    }


    const {
        error
    } =
    await supabaseClient
        .from("messages")
        .insert({

            sender_id:
                CurrentUser.id,

            receiver_id:
                CurrentChatUser.id,

            content:
                text,

            reply_to:
                ReplyingTo
                    ? ReplyingTo.id
                    : null

        })


    if (error) {

        console.log(error.message)

        alert(error.message)

        return

    }


    Input.value = ""

    CancelReplyFunction()


    /*
       We load immediately for the sender.

       Realtime will handle the other person's screen.
    */

    await LoadMessages()

}



/* =========================
   ENTER TO SEND
========================= */

Input.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter"
        ) {

            Send.click()

        }

    }
)



/* =========================
   REPLY
========================= */

function StartReply(item) {

    ReplyingTo = item

    ReplyBar.style.display =
        "flex"


    if (
        item.sender_id ===
        CurrentUser.id
    ) {

        ReplyName.textContent =
            "You"

    } else {

        ReplyName.textContent =
            CurrentChatUser.username

    }


    ReplyText.textContent =
        item.content.startsWith(
            "STICKER:"
        )
            ? "Sticker"
            : item.content


    Input.focus()

}


function CancelReplyFunction() {

    ReplyingTo = null

    ReplyBar.style.display =
        "none"

    ReplyText.textContent = ""

}


CancelReply.addEventListener(
    "click",
    CancelReplyFunction
)



/* =========================
   EDIT
========================= */

async function EditMessage(item) {

    if (
        !item.content ||
        item.content.startsWith(
            "STICKER:"
        )
    ) {

        return

    }


    const newText =
        prompt(
            "Edit message:",
            item.content
        )


    if (
        newText === null ||
        newText.trim() === ""
    ) {

        return

    }


    const {
        error
    } =
    await supabaseClient
        .from("messages")
        .update({

            content:
                newText.trim(),

            edited: true

        })
        .eq(
            "id",
            item.id
        )
        .eq(
            "sender_id",
            CurrentUser.id
        )


    if (error) {

        console.log(error.message)

        return

    }


    await LoadMessages()

}



/* =========================
   DELETE
========================= */

async function DeleteMessage(item) {

    const yes =
        confirm(
            "Delete this message?"
        )


    if (!yes) {

        return

    }


    const {
        error
    } =
    await supabaseClient
        .from("messages")
        .delete()
        .eq(
            "id",
            item.id
        )
        .eq(
            "sender_id",
            CurrentUser.id
        )


    if (error) {

        console.log(error.message)

        return

    }


    await LoadMessages()

}



/* =========================
   AUTO SCROLL
========================= */

function ScrollToBottom() {

    Messages.scrollTop =
        Messages.scrollHeight

}



/* =========================
   SETTINGS
========================= */

SettingsButton.addEventListener(
    "click",
    function() {

        SettingsPanel.style.display =
            "block"

    }
)


CloseSettings.addEventListener(
    "click",
    function() {

        SettingsPanel.style.display =
            "none"

    }
)



/* =========================
   LOGOUT
========================= */

Logout.addEventListener(
    "click",
    async function() {

        const {
            error
        } =
        await supabaseClient.auth.signOut()


        if (error) {

            console.log(error.message)

            return

        }


        CurrentUser = null

        CurrentChatUser = null

        SettingsPanel.style.display =
            "none"


        ChatApp.style.display =
            "none"

        Auth.style.display =
            "flex"


        LoginPage.style.display =
            "none"

        SignupPage.style.display =
            "block"

    }
)



/* =========================
   PROFILE PICTURE UPLOAD
========================= */

UploadAvatar.addEventListener(
    "click",
    UploadProfilePicture
)


async function UploadProfilePicture() {

    const file =
        AvatarFile.files[0]


    if (!file) {

        alert(
            "Choose an image first."
        )

        return

    }


    const extension =
        file.name
            .split(".")
            .pop()


    const path =
        CurrentUser.id +
        "." +
        extension


    const {
        error: uploadError
    } =
    await supabaseClient.storage
        .from("avatars")
        .upload(
            path,
            file,
            {
                upsert: true
            }
        )


    if (uploadError) {

        console.log(
            uploadError.message
        )

        alert(
            uploadError.message
        )

        return

    }


    const {
        data
    } =
    supabaseClient.storage
        .from("avatars")
        .getPublicUrl(path)


    const avatarURL =
        data.publicUrl


    const {
        error: updateError
    } =
    await supabaseClient
        .from("profiles")
        .update({

            avatar_url:
                avatarURL

        })
        .eq(
            "id",
            CurrentUser.id
        )


    if (updateError) {

        console.log(
            updateError.message
        )

        return

    }


    alert(
        "Profile picture updated!"
    )


    await LoadUsers()


    if (CurrentChatUser) {

        const {
            data: profile
        } =
        await supabaseClient
            .from("profiles")
            .select(
                "id, username, avatar_url"
            )
            .eq(
                "id",
                CurrentChatUser.id
            )
            .single()


        if (profile) {

            CurrentChatUser =
                profile

            ChatAvatar.src =
                profile.avatar_url || ""

        }

    }

}



/* =========================
   THEMES
========================= */

const ThemeButtons =
    document.querySelectorAll(
        "#ThemeButtons button"
    )


ThemeButtons.forEach(
    function(button) {

        button.addEventListener(
            "click",
            function() {

                const theme =
                    button.dataset.theme


                document.body.className =
                    "theme-" + theme


                localStorage.setItem(
                    "theme",
                    theme
                )

            }
        )

    }
)


const SavedTheme =
    localStorage.getItem(
        "theme"
    )


if (SavedTheme) {

    document.body.className =
        "theme-" + SavedTheme

}



/* =========================
   STICKER UPLOAD
========================= */

UploadSticker.addEventListener(
    "click",
    UploadNewSticker
)


async function UploadNewSticker() {

    const file =
        StickerFile.files[0]


    if (!file) {

        alert(
            "Choose a sticker image first."
        )

        return

    }


    const extension =
        file.name
            .split(".")
            .pop()


    const path =
        CurrentUser.id +
        "/" +
        crypto.randomUUID() +
        "." +
        extension


    const {
        error: uploadError
    } =
    await supabaseClient.storage
        .from("stickers")
        .upload(
            path,
            file
        )


    if (uploadError) {

        console.log(
            uploadError.message
        )

        alert(
            uploadError.message
        )

        return

    }


    const {
        data
    } =
    supabaseClient.storage
        .from("stickers")
        .getPublicUrl(path)


    const stickerURL =
        data.publicUrl


    const {
        error
    } =
    await supabaseClient
        .from("stickers")
        .insert({

            user_id:
                CurrentUser.id,

            url:
                stickerURL

        })


    if (error) {

        console.log(
            error.message
        )

        return

    }


    StickerFile.value = ""


    await LoadStickers()


    alert(
        "Sticker uploaded!"
    )

}



/* =========================
   LOAD STICKERS
========================= */

async function LoadStickers() {

    const {
        data,
        error
    } =
    await supabaseClient
        .from("stickers")
        .select(
            "id, user_id, url"
        )
        .order(
            "id",
            {
                ascending: false
            }
        )


    if (error) {

        console.log(error.message)

        return

    }


    StickerPanel.replaceChildren()


    for (const sticker of data) {

        const image =
            document.createElement("img")

        image.classList.add(
            "StickerChoice"
        )

        image.src =
            sticker.url


        image.addEventListener(
            "click",
            function() {

                SendSticker(
                    sticker.url
                )

            }
        )


        StickerPanel.appendChild(
            image
        )

    }


    StickersLoaded = true

}



/* =========================
   STICKER PANEL
========================= */

StickerButton.addEventListener(
    "click",
    function() {

        if (
            StickerPanel.style.display ===
            "block"
        ) {

            StickerPanel.style.display =
                "none"

        } else {

            StickerPanel.style.display =
                "block"

        }

    }
)



/* =========================
   SEND STICKER
========================= */

async function SendSticker(url) {

    if (!CurrentChatUser) {

        alert(
            "Select a chat first."
        )

        return

    }


    const {
        error
    } =
    await supabaseClient
        .from("messages")
        .insert({

            sender_id:
                CurrentUser.id,

            receiver_id:
                CurrentChatUser.id,

            content:
                "STICKER:" + url,

            reply_to:
                ReplyingTo
                    ? ReplyingTo.id
                    : null

        })


    if (error) {

        console.log(
            error.message
        )

        return

    }


    StickerPanel.style.display =
        "none"


    CancelReplyFunction()


    await LoadMessages()

}



/* =========================
   MARK CHAT READ
========================= */

async function MarkChatRead() {

    if (!CurrentChatUser) {

        return

    }


    const {
        error
    } =
    await supabaseClient
        .from("message_reads")
        .upsert({

            user_id:
                CurrentUser.id,

            other_user_id:
                CurrentChatUser.id,

            last_read_at:
                new Date().toISOString()

        })


    if (error) {

        console.log(
            error.message
        )

    }

}



/* =========================
   REALTIME
========================= */

/*
   IMPORTANT:

   There is NO one-second reload loop.

   Supabase Realtime tells us when a
   message is inserted/updated/deleted.
*/

supabaseClient
    .channel("messages-live")
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "messages"
        },
        async function(payload) {

            if (!CurrentChatUser) {

                return

            }


            const message =
                payload.new ||
                payload.old


            if (!message) {

                return

            }


            const isOurChat =
                (
                    message.sender_id ===
                    CurrentUser.id &&
                    message.receiver_id ===
                    CurrentChatUser.id
                )
                ||
                (
                    message.sender_id ===
                    CurrentChatUser.id &&
                    message.receiver_id ===
                    CurrentUser.id
                )


            if (!isOurChat) {

                return

            }


            await LoadMessages()

        }
    )
    .subscribe()



/* =========================
   START APP
========================= */

CheckUser()