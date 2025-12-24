async function fetchGoldPrice() {
    var myHeaders = new Headers();
    myHeaders.append("x-access-token", "goldapi-cvc4msmjj9sapo-io");
    myHeaders.append("Content-Type", "application/json");

    var requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'
    };

    try {
        const response = await fetch("https://www.goldapi.io/api/XAU/USD", requestOptions);
        const data = await response.json();
        
        // GoldAPI returns 'price', but we check for it safely
        const price = data.price;
        const priceElement = document.getElementById('gold-price');
        
        if (priceElement && price) {
            priceElement.innerText = `$${price.toLocaleString()} USD/oz`;
            console.log("Institutional Gold Price Updated: ", price);
        } else {
            console.log("Data received but price missing:", data);
        }
    } catch (error) {
        console.error("Gold API Auth Error:", error);
    }
}

// Update every 5 minutes to stay within API limits
setInterval(fetchGoldPrice, 300000);
window.onload = fetchGoldPrice;
