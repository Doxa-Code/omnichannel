export const loadFacebookSDK = () =>
  new Promise<void>((resolve) => {
    if (window.FB) return resolve(); // já carregou

    window.fbAsyncInit = function () {
      FB.init({
        appId: "579228267872440",
        autoLogAppEvents: true,
        xfbml: true,
        version: "v23.0",
      });
      resolve();
    };

    const id = "facebook-jssdk";
    if (document.getElementById(id)) return;

    const js = document.createElement("script");
    js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    document.body.appendChild(js);
  });
