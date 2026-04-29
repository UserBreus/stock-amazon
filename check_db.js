const URL = "https://jucfmjzozshdbbtscsbw.supabase.co/rest/v1/Stock_Variantes?select=*&nombre_variante=like.*1,60*";
const KEY = "sb_publishable_zLIXPTVrfJBkVoYIj4tUaw_fWZk2n3y";

fetch(URL, {
    headers: {
        "apikey": KEY,
        "Authorization": "Bearer " + KEY
    }
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(console.error);
