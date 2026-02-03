pipeline {
  agent any
  options { timestamps() }

  environment {
    REPORT_FILE = ""
    ZIP_FILE = ""
  }

  stages {

    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Run k6 Test') {
      steps {
        sh '''
          set -e
          k6 run script.js
        '''
      }
    }

    stage('Prepare Report') {
      steps {
        script {
          env.REPORT_FILE = sh(
            script: "ls -1 report_*.html | sort | tail -n 1",
            returnStdout: true
          ).trim()

          env.ZIP_FILE = env.REPORT_FILE.replace('.html', '.zip')

          sh """
            zip -j ${env.ZIP_FILE} ${env.REPORT_FILE}
          """

          archiveArtifacts artifacts: env.REPORT_FILE
          archiveArtifacts artifacts: env.ZIP_FILE
        }
      }
    }
  }

  post {
    success {
      script {
        withCredentials([string(credentialsId: 'slack-bot-token', variable: 'SLACK_TOKEN')]) {
          sh """
            curl -s -X POST https://slack.com/api/files.upload \
              -H "Authorization: Bearer ${SLACK_TOKEN}" \
              -F channels=#all-poc-k6 \
              -F title="k6 HTML Report (ZIP)" \
              -F file=@${ZIP_FILE}
          """
        }

        slackSend(
          channel: "#all-poc-k6",
          message: """✅ *k6 POC PASSED*
• Job: ${env.JOB_NAME}
• Build: ${env.BUILD_NUMBER}
• Jenkins HTML: ${env.BUILD_URL}artifact/${env.REPORT_FILE}

📎 Download the ZIP above → extract → open HTML in browser.
"""
        )
      }
    }
  }
}
