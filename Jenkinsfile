pipeline {
  agent any

  options {
    timestamps()
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Verify k6') {
      steps {
        sh 'k6 version'
      }
    }

    stage('Run k6 Test') {
      steps {
        withEnv(["BUILD_NUMBER=${env.BUILD_NUMBER}"]) {
          sh '''
            set -e
            k6 run script.js
          '''
        }
      }
    }

    stage('Collect & Upload Report') {
      steps {
        script {
          def reportFile = sh(
            script: "ls -1 report_${env.BUILD_NUMBER}_*.html",
            returnStdout: true
          ).trim()

          archiveArtifacts artifacts: reportFile, fingerprint: true

          withCredentials([string(credentialsId: 'slack-bot-token', variable: 'SLACK_TOKEN')]) {
            sh """
              FILE="${reportFile}"
              SIZE=\$(stat -c%s "\$FILE")
              CHANNEL="C0ACKM8BR7G"

              RESP=\$(curl -s -X POST https://slack.com/api/files.getUploadURLExternal \\
                -H "Authorization: Bearer \$SLACK_TOKEN" \\
                -H "Content-Type: application/json; charset=utf-8" \\
                --data "{\\"filename\\":\\"$FILE\\",\\"length\\":$SIZE}")

              URL=\$(echo "\$RESP" | jq -r .upload_url)
              ID=\$(echo "\$RESP" | jq -r .file_id)

              curl -s -X PUT "\$URL" --data-binary @"\$FILE"
              curl -s -X POST https://slack.com/api/files.completeUploadExternal \\
                -H "Authorization: Bearer \$SLACK_TOKEN" \\
                -H "Content-Type: application/json; charset=utf-8" \\
                --data "{\\"files\\":[{\\"id\\":\\"\$ID\\",\\"title\\":\\"k6 HTML Report\\"}],\\"channel_id\\":\\"$CHANNEL\\"}"
            """
          }
        }
      }
    }
  }

  post {
    success {
      slackSend(
        channel: "#all-poc-k6",
        message: """✅ *k6 POC PASSED*
• Job: ${env.JOB_NAME}
• Build: ${env.BUILD_NUMBER}

📎 HTML report uploaded above — download & open in browser.
"""
      )
    }

    failure {
      slackSend(
        channel: "#all-poc-k6",
        message: """❌ *k6 POC FAILED*
• Job: ${env.JOB_NAME}
• Build: ${env.BUILD_NUMBER}
• Logs: ${env.BUILD_URL}
"""
      )
    }
  }
}
