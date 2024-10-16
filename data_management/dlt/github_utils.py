from github import Github, Auth

class GithubRepo:
    def __init__(self, auth_token, username, repo_name) -> None:
        self.g = Github(auth= Auth.Token(auth_token))
        self.repo = self.g.get_repo("/".join([username, repo_name]))
        pass

    def getFileContent(self, file_path, branch):
        return self.repo.get_contents(path=file_path, ref=branch).decoded_content.decode()

    def close(self):
        return self.g.close()
