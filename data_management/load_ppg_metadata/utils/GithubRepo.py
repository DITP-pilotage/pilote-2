from github import Github, Auth
from pandas import read_csv
import io

class GithubRepo:
    def __init__(self, auth_token, username, repo_name) -> None:
        self.g = Github(auth= Auth.Token(auth_token))
        self.repo = self.g.get_repo("/".join([username, repo_name]))
        pass

    def getFileContent(self, file_path, branch):
        return self.repo.get_contents(path=file_path, ref=branch).decoded_content.decode()

    def close(self):
        return self.g.close()

    def getFileAsDataframe(self, path, branch):
        csv_string = self.getFileContent(path, branch)
        return read_csv(io.BytesIO(csv_string.encode()), index_col=0)
