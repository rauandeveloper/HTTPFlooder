HTTP Flooder + AI Analytics

HTTP Flooder Tool is a robust and versatile utility designed for conducting high-traffic load testing against web servers. It supports HTTP and HTTPS protocols, proxy rotation, and dynamic rate limit adjustments to optimize performance based on server response times. This tool is equipped with an AI-powered site analysis feature that provides detailed insights about the target website, including server information, page title, and meta descriptions.

Features

    Multi-Threaded Attack: Run multiple threads to simulate high traffic loads.
    Proxy Support: Utilize HTTP and HTTPS proxies from a provided list to mask the source of the requests.
    Rate Limiting: Automatically adjust the request rate based on the server's capacity.
    Site Analysis: Use AI to analyze the target site and gather details like title, meta description, and server information.
    Debug Mode: Enable detailed logging to monitor the tool's operations and diagnose issues.

Installation
Clone the repository:

    git clone https://github.com/rauandeveloper/HTTPFlooder.git
    cd HTTPFlooder

Install dependencies:

    npm install axios http-proxy-agent https-proxy-agent cheerio cli-progress dotenv commander

Run the tool with the following syntax:

    node attack.js <target-url> <duration> --port <port> --ai <true/false> --proxy <proxy-file> --debug <true/false> --threads <number>

Example

    node attack.js https://github.com/ 60 --port 80 --ai true --proxy proxy.txt --debug true --threads 1

Options

    <target-url>: The URL of the target site (e.g., https://example.com).
    <duration>: Duration of the attack in seconds.
    --port <port>: Port number to target.
    --ai <true/false>: Enable or disable AI site analysis.
    --proxy <proxy-file>: Path to the file containing a list of proxy addresses.
    --debug <true/false>: Enable or disable debug mode for detailed logs.
    --threads <number>: Number of concurrent threads to use for the attack.

Proxy List Format

The proxy list file should contain one proxy address per line in the following format:

    <ip-address>:<port>

Example:

    18.133.117.147:3128
    34.244.162.10:8080
    54.170.11.249:3128
    3.252.51.79:8443

Disclaimer
   
Use this tool responsibly and only on servers you own or have explicit permission to test. Misuse of this tool for unauthorized access or disruption of services is illegal and unethical.
