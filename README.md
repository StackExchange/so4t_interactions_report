# Stack Overflow for Teams Interactions (so4t_interactions)
An API script for Stack Overflow for Teams that creates a chord diagram, demonstrating how teams are interacting within the product.

Example chord diagram:

![Example chord diagram](https://github.com/StackExchange/so4t_interactions_report/blob/main/Examples/chord_diagram.png)


## Requirements
* Python 3.9 or higher ([download](https://www.python.org/downloads/))
* Operating system: Linux, MacOS, or Windows
* "Department" assertion enabled in SAML configuration (admin settings)


## Setup

[Download](https://github.com/StackExcahnge/so4t_interactions_report/archive/refs/heads/main.zip) and unpack the contents of this repository

**Installing Dependencies**

* Open a terminal window (or, for Windows, a command prompt)
* Navigate to the directory where you unpacked the files
* Install the dependencies: `pip3 install -r requirements.txt`


**API Authentication**

For the Business tier, you'll need a [personal access token](https://stackoverflowteams.help/en/articles/4385859-stack-overflow-for-teams-api) (PAT). You'll need to obtain an API key and an access token for Enterprise. Documentation for creating an Enterprise key and token can be found within your instance at this url: `https://[your_site]/api/docs/authentication`

**Before proceeding, please note a critical step when creating your API Application in Stack Overflow Enterprise for Access Token generation:**

**Generating an Access Token**

To generate an Access Token for Enterprise, you must first ensure your API Application is correctly configured:

* **API Application "Domain" Field Requirement:** When creating your API Application (where you obtain your Client ID and Client Secret), the "Domain" field *must* be populated with the base URL of your Stack Overflow Enterprise instance (e.g., `https://your.so-enterprise.url`). **Although the UI may mark this field as 'Optional,' failure to populate it will prevent Access Token generation and lead to a `"redirect_uri is not configured"` error during the OAuth flow.**

Once your API Application is configured with a valid Domain, follow these steps to generate your Access Token:

* Go to the page where you created your API key. Take note of the "Client ID" associated with your API key.
* Go to the following URL, replacing the base URL, the `client_id`, and the base URL of the `redirect_uri` with your own:
`https://YOUR.SO-ENTERPRISE.URL/oauth/dialog?client_id=111&redirect_uri=https://YOUR.SO-ENTERPRISE.URL/oauth/login_success`
* You may be prompted to log in to Stack Overflow Enterprise if you're not already. Either way, you'll be redirected to a page that simply says "Authorizing Application."
* In the URL of that page, you'll find your access token. Example: `https://YOUR.SO-ENTERPRISE.URL/oauth/login_success#access_token=YOUR_TOKEN`

**Note on Access Token Requirements:**
While API v3 now generally allows querying with just an API key for most GET requests, certain paths and data (e.g., `/images` and the email attribute on a `User` object) still specifically require an Access Token for access. If you encounter permissions errors on such paths, ensure you are using an Access Token.


## Basic Usage
In a terminal window, navigate to the directory where you unpacked the script. 
Run the script using the following format, replacing the URL, token, and/or key with your own:
- Business: `python3 so4t_interactions.py --url "https://stackoverflowteams.com/c/TEAM-NAME" --token "YOUR_TOKEN"`
- Enterprise: `python3 so4t_interactions.py --url "https://SUBDOMAIN.stackenterprise.co" --key "YOUR_KEY"`

At the beginning of the script, a small Chrome window will appear, prompting you to log in to your instance of Stack Overflow Enterprise. This is necessary to obtain data that is not currently available via the API.

After logging in, the Chrome window will disappear, and the script will proceed in the terminal window. Creating a login session is necessary to gather additional data from Stack Overflow for Teams that are unavailable via the API.

The script can take several minutes to run. As it runs, it will update the terminal window with the tasks it performs.

When the script completes, it will indicate that the chord diagram has been created and provide the path to the file. The file will be saved in the same directory as the script.


## Advanced Usage

You can add some additional arguments to the command line to customize the script's behavior, described below. All arguments (and instructions) can also be found by running the `--help` argument: `python3 so4t_interactions.py --help`

### `--remove-team-numbers`

In many organizations, team names aren't as simple as "Engineering" or "Product Management". Instead, they're often something like "Eng1" or "PM2.6". This can be problematic when it creates too much granularity for the chord diagram. 

The `--remove-team-numbers` argument allows you to easily remove the team number from the team names. Example: "Eng1" and "Eng2.1" would both be renamed to simply "Eng", thus consolidating the two teams into one for the chord diagram.

Example usage:
`python3 so4t_interactions.py --url "https://SUBDOMAIN.stackenterprise.co" --key "YOUR_KEY" --remove-team-numbers`

> NOTE: this argument is incompatible with the `--team-rename` argument. Choose one or the other.

### `--team-rename`

This is a more powerful method of changing team names. Sometimes, the team names obtained from the identity provider (via SAML) aren't ideal for a variety of reasons. Examples:
* Too verbose: "PMO - Project Management Office - CIO Special Projects"
* Too generic: "Team 1"
* Too specific: "Team 1 - Argentina"

Also, there's often a desire to consolidate team names that are functionally the same but have different names in the identity provider. Example: "Team 1 - Argentina" and "Team 1 - London" could be renamed to simply "Team 1".

The `--team-rename` argument allows you to provide a CSV file ([template here](https://github.com/jklick-so/so4t_interactions/tree/main/Templates)) that maps the team names from the identity provider to a more appropriate name. The CSV file should have two columns:
* `old_team_name` - the name of the team as it appears in the identity provider
* `new_team_name` - the name you'd like to use in the chord diagram

Example usage:
`python3 so4t_interactions.py --url "https://SUBDOMAIN.stackenterprise.co" --key "YOUR_KEY" --team-rename "PATH_TO_CSV"`

> NOTE: this argument is incompatible with the `--remove-team-number` argument. Choose one or the other.


## Support, security, and legal
If you encounter problems using the script, please leave feedback in the Github Issues. You can also clone and change the script to suit your needs. It is provided as-is, with no warranty or guarantee of any kind.

All data is handled locally on the device from which the script is run. The script does not transmit data to other parties, such as Stack Overflow. All of the API calls performed are read-only, so there is no risk of editing or adding content on your Stack Overflow for Teams instance.
