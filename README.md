# Wrangler Worker Cloudflare Healthcheck Load Balancer

This project is a Cloudflare Worker for performing health checks on a load balancer of servers. Follow the steps below to set up and deploy the worker.

## Prerequisites

1. **API Token**: Obtain an API token with the following permissions:
   - **Access User**: `User Details → Read`
   - **Edit zone DNS**: `Zone DNS | Edit`
   - **Account**: `Workers Scripts → Edit`

   Navigate to the Cloudflare dashboard to create and manage your API token.

2. **Install Wrangler**:
   Ensure you have Node.js installed, then install Wrangler via npm:
   ```bash
   npm install -g wrangler
   ```

## Setup

1. **Authenticate Wrangler**:
   ```bash
   wrangler whoami
   ```
   This command verifies your authentication and account details.

2. **Initialize the Project**:
   ```bash
   wrangler init healthchecker-test
   ```
   After initializing the project, add your account ID to `config.toml` in the project directory.

3. **Configure Secrets**:
   Add the required secrets to Wrangler:
   ```bash
   wrangler secret put API_TOKEN
   wrangler secret put ZONE_ID
   ```

## Deployment

1. **Develop the Script**:
   Write and test your worker script in the `index.js` file inside the project directory.

2. **Deploy the Worker**:
   ```bash
   wrangler deploy
   ```

## Usage

- **Access the Deployed Worker**:
  Visit the deployed worker URL:
  ```
  https://healthchecker-test.domain.workers.dev
  ```

- **Cloudflare Dashboard**:
  Manage and view the worker through the Cloudflare dashboard:
  ```
  https://dash.cloudflare.com/?to=/:account/workers/services/view/healthchecker-test
  ```

## Notes

- Ensure your API token has the correct permissions to prevent deployment issues.
- Update `config.toml` with any additional configuration settings as needed.
- For troubleshooting, refer to the [Wrangler documentation](https://developers.cloudflare.com/workers/wrangler/) or check the Cloudflare dashboard logs.



