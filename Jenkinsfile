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

          // Archive in Jenkins
          archiveArtifacts artifacts: reportFile, fingerprint: true

          // Save for Slack steps
          env.REPORT_FILE = reportFile
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

        // Upload HTML report to Slack (DOWNLOADABLE)
        if (env.REPORT_FILE) {
          slackUploadFile(
            channel: "#all-poc-k6",
            filePath: env.REPORT_FILE,
            initialComment: "📊 k6 HTML Test Report (download & open in browser)"
          )
        }

        // Slack summary message
        slackSend(
          channel: "#all-poc-k6",
          message: """✅ *k6 POC PASSED*
• Job: ${env.JOB_NAME}
• Build: ${env.BUILD_NUMBER}
• Jenkins Report Link: ${reportLink}

ℹ️ Download the attached HTML file to view the full colored report.
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
