const axios = require("axios");
require("dotenv").config();

const { multiTokenizer } = require("./multitokenizer");

const fetchGitHubData = async (url, token) => {
  try {
    const response = await axios({
      method: "get",
      url: url,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.cloak-preview",
        Authorization: `bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const statsFetch = async (parameters) => {
  const _stats = {
    pr: 0,
    stars: 0,
    issues: 0,
    commits: 0,
  };

  // Fetch data for each type of statistic
  const commitsResponse = await fetchGitHubData(
    `https://api.github.com/search/commits?q=author:${parameters.login}+committer-date:>2020-01-01`,
    process.env.TOKEN_1
  );
  const issuesResponse = await fetchGitHubData(
    `https://api.github.com/search/issues?q=author:${parameters.login}+is:issue+created:2020-01-01..2020-12-31`,
    process.env.TOKEN_1
  );
  const prsResponse = await fetchGitHubData(
    `https://api.github.com/search/issues?q=author:${parameters.login}+is:pr+created:2020-01-01..2020-12-31`,
    process.env.TOKEN_1
  );

  // Calculate total number of commits, issues, and pull requests
  _stats.commits = commitsResponse.total_count;
  _stats.issues = issuesResponse.total_count;
  _stats.pr = prsResponse.total_count;

  // Calculate total number of stars
  const userInfoResponse = await axios({
    url: "https://api.github.com/graphql",
    method: "post",
    headers: {
      Authorization: `bearer ${process.env.TOKEN_1}`,
    },
    data: {
      query: `
        query userInfo($login: String!) {
          user(login: $login) {
            repositories(first: 100, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}) {
              totalCount
             nodes {
              stargazers {
                totalCount
              }
            }
          }
        }
      }`,
      variables: parameters,
    },
  });

  _stats.stars = userInfoResponse.data.data.user.repositories.nodes.reduce(
    (prev, curr) => prev + curr.stargazers.totalCount,
    0
  );

  return _stats;
};
