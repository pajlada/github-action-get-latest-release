const core = require('@actions/core');
const { Octokit } = require("@octokit/rest");

const repository = core.getInput('repository');
const token = core.getInput('token');
var owner = core.getInput('owner');
var repo = core.getInput('repo');
var excludes = core.getInput('excludes').trim().split(",");
const title = core.getInput('title');
const asset = core.getInput('asset');

const octokit = (() => {
    if (token) {
        return new Octokit({ auth: token, });
    } else {
        return new Octokit();
    }
})();

async function run() {
    try {
        if (repository) {
            [owner, repo] = repository.split("/");
        }
        let assets = [];
        var releases = await octokit.repos.listReleases({
            owner: owner,
            repo: repo,
        });
        releases = releases.data;
        assets = releases.assets;
        if (excludes.includes('prerelease')) {
            releases = releases.filter(x => x.prerelease != true);
        }
        if (excludes.includes('draft')) {
            releases = releases.filter(x => x.draft != true);
        }
        if (title) {
            releases = releases.filter(x => x.name.includes(title));
        }
        if (asset) {
            assets = assets.filter(x => x.name == asset);
        }
        if (releases.length) {
            core.setOutput('release', releases[0].tag_name);
            core.setOutput('id', String(releases[0].id));
            core.setOutput('description', String(releases[0].body));
            if (asset) {
                if (assets.length) {
                    core.setOutput('asset_id', assets[0].id);
                } else {
                    core.setFailed("No valid assets");
                }
            }
        } else {
            core.setFailed("No valid releases");
        }
    }
    catch (error) {
        core.setFailed(error.message);
    }
}

run()
