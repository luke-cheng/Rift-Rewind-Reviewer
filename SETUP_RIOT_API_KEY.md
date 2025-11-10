# Setting Up Riot API Key in AWS Amplify

Your Riot API function is configured to use a secret named `RIOT_API_KEY`. Here's how to set it up:

## For Local Development (Sandbox)

When running `npx ampx sandbox` locally, you can set the secret using the Amplify CLI:

```bash
# Set the secret for your local sandbox
npx ampx sandbox secret set RIOT_API_KEY
```

This will prompt you to enter your Riot API key. The secret will be stored securely and used by your Lambda function.

## For Production/Cloud Deployment

### Option 1: Using AWS Secrets Manager Console

1. **Navigate to AWS Secrets Manager**:
   - Go to [AWS Secrets Manager Console](https://console.aws.amazon.com/secretsmanager/)
   - Make sure you're in the same region as your Amplify app

2. **Create or Update the Secret**:
   - Click "Store a new secret"
   - Select "Other type of secret"
   - Choose "Plaintext" and enter your Riot API key
   - Click "Next"

3. **Configure Secret Details**:
   - Secret name: `RIOT_API_KEY` (must match exactly)
   - Description: "Riot Games API Key for League of Legends API"
   - Click "Next"

4. **Configure Rotation** (optional):
   - You can skip rotation for API keys
   - Click "Next"

5. **Review and Store**:
   - Review your settings
   - Click "Store"

6. **Grant Lambda Access**:
   - The Amplify-generated Lambda function needs permission to read this secret
   - This is typically handled automatically by Amplify, but you can verify in IAM

### Option 2: Using AWS CLI

```bash
# Create the secret using AWS CLI
aws secretsmanager create-secret \
  --name RIOT_API_KEY \
  --secret-string "YOUR_RIOT_API_KEY_HERE" \
  --region us-east-1  # Replace with your region

# Or update if it already exists
aws secretsmanager update-secret \
  --secret-id RIOT_API_KEY \
  --secret-string "YOUR_RIOT_API_KEY_HERE" \
  --region us-east-1
```

### Option 3: Using Amplify CLI for Cloud

```bash
# Set secret for a specific branch/environment
npx ampx sandbox secret set RIOT_API_KEY --branch main
```

## Getting Your Riot API Key

1. Go to [Riot Games Developer Portal](https://developer.riotgames.com/)
2. Sign in with your Riot account
3. Navigate to "API Keys" section
4. Create a new API key or use an existing one
5. Copy the API key (it looks like: `RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

## Verifying the Setup

After setting the secret, verify it's working:

1. **Check Lambda Function Environment**:
   - Go to AWS Lambda Console
   - Find your function (named something like `riot-api-handler-xxxxx`)
   - Check the "Configuration" tab → "Environment variables"
   - You should see `RIOT_API_KEY` listed (the value will be masked for security)

2. **Test the Function**:
   - Try using your app to search for a player
   - Check CloudWatch Logs if there are any errors

## Important Notes

- **Never commit your API key to git** - it's already in `.gitignore`
- The secret name `RIOT_API_KEY` must match exactly what's in `amplify/functions/riot-api/resource.ts`
- Make sure your Lambda function's IAM role has `secretsmanager:GetSecretValue` permission for this secret
- Amplify Gen 2 typically handles IAM permissions automatically, but verify if you encounter issues

## Troubleshooting

If you get errors about missing `RIOT_API_KEY`:

1. Verify the secret exists in Secrets Manager with the exact name `RIOT_API_KEY`
2. Check that you're in the correct AWS region
3. Verify the Lambda function's IAM role has permissions to read the secret
4. Check CloudWatch Logs for detailed error messages

