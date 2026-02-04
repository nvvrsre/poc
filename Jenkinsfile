pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    timestamps()
  }

  environment {
    REPORT_FILE = ""
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
          k6 run script.js
        '''
      }
    }

    stage('Collect Report') {
      steps {
        script {
          REPORT_FILE = sh(
            script: "ls -t report_*.html | head -n 1",
            returnStdout: true
          ).trim()

          if (!REPORT_FILE) {
            error "No HTML report found"
          }

          echo "Found report: ${REPORT_FILE}"

          archiveArtifacts(
            artifacts: REPORT_FILE,
            fingerprint: true,
            allowEmptyArchive: false
          )
        }
      }
    }
  }

  post {

    success {
      script {
        def reportUrl = "${env.BUILD_URL}artifact/${REPORT_FILE}"

        slackSend(
          channel: "#all-poc-k6",
          message: """✅ *k6 POC PASSED*
• Job: ${env.JOB_NAME}
• Build: #${env.BUILD_NUMBER}
• Report: ${reportUrl}
"""
        )
      }
    }

    failure {
      slackSend(
        channel: "#all-poc-k6",
        message: """❌ *k6 POC FAILED*
• Job: ${env.JOB_NAME}
• Build: #${env.BUILD_NUMBER}
• Logs: ${env.BUILD_URL}
"""
      )
    }
  }
}
