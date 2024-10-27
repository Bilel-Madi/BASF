// src/routes/valve-control/+server.ts

export async function POST({ request }): Promise<Response> {
    const url = 'https://me1pro.loriot.io/1/rest';
    // Ideally, use environment variables for sensitive information like API keys
    const apiKey = 'vgEAJAAAABBtZTFwcm8ubG9yaW90LmlvVjWmYgqNiAP5G7aZCTkbUg=='; // Replace 'YOUR_API_KEY' with your actual API key
    const body = await request.json();

    try {
        const apiResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`, // Include any necessary headers here
            },
            body: JSON.stringify({
                // Adjust these properties according to your API requirements
                cmd: "tx",
                EUI: "24E124460C484055",
                port: 85,
                confirmed: false,
                data: body.data, // The command data to open or close the valve
                appid: "BE010024"
            })
        });

        // Instead of creating a custom object, use the Response constructor
        if (!apiResponse.ok) {
            return new Response(JSON.stringify({ error: `Failed to fetch from the external API: ${apiResponse.statusText}` }), {
                status: apiResponse.status,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        const data = await apiResponse.json();
        return new Response(JSON.stringify(data), {
            status: 200, // HTTP status code
            headers: {
                'Content-Type': 'application/json' // Content-Type header
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, // Internal Server Error
            headers: {
                'Content-Type': 'application/json' // Content-Type header
            }
        });
    }
}
