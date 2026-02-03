pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
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
        sh '''
          set -e
          echo "Running k6 load test..."
          ls -l
          k6 run script.js
        '''
      }
    }
  }

  post {

    always {
      script {
        // Find latest HTML report
        def reportFile = sh(
          script: "ls -1 report_*.html 2>/dev/null | sort | tail -n 1 || true",
          returnStdout: true
        ).trim()

        if (reportFile) {
          echo "Found report: ${reportFile}"
          env.REPORT_FILE = reportFile

          // Archive in Jenkins
          archiveArtifacts artifacts: reportFile, fingerprint: true
        } else {
          echo "No HTML report found"
        }
      }
    }

    success {
      script {
        def reportLink = env.REPORT_FILE
          ? "${env.BUILD_URL}artifact/${env.REPORT_FILE}"
          : "No report generated"

        // Upload HTML report to Slack using Web API (GUARANTEED)
        if (env.REPORT_FILE) {
          withCredentials([string(credentialsId: 'slack-bot-token', variable: 'SLACK_TOKEN')]) {
            sh """
              curl -s -X POST https://slack.com/api/files.upload \\
                -H "Authorization: Bearer $SLACK_TOKEN" \\
                -F channels=#all-poc-k6 \\
                -F title="k6 HTML Test Report" \\
                -F filename="${env.REPORT_FILE}" \\
                -F file=@${env.REPORT_FILE}
            """
          }
        }

        // Slack summary message
        slackSend(
          channel: "#all-poc-k6",
          message: """✅ *k6 POC PASSED*
• Job: ${env.JOB_NAME}
• Build: ${env.BUILD_NUMBER}
• Jenkins Report Link: ${reportLink}

ℹ️ The HTML report is uploaded above. Download and open it in a browser to see full colors & charts.
"""
        )
      }
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
