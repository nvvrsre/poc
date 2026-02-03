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
          ls -l
          k6 run script.js
        '''
      }
    }

    stage('Collect Report') {
      steps {
        script {
          // Find the latest generated report
          def reportFile = sh(
            script: "ls -t report_*.html 2>/dev/null | head -n 1 || true",
            returnStdout: true
          ).trim()

          if (!reportFile) {
            error "No HTML report found"
          }

          echo "Found report: ${reportFile}"
          env.REPORT_FILE = reportFile

          // Archive so Jenkins exposes it as an artifact
          archiveArtifacts artifacts: reportFile, fingerprint: true
        }
      }
    }
  }

  post {

    success {
      script {
        def reportUrl = "${env.BUILD_URL}artifact/${env.REPORT_FILE}"

        slackSend(
          channel: "#all-poc-k6",
          message: """✅ *k6 POC PASSED*
• Job: ${env.JOB_NAME}
• Build: ${env.BUILD_NUMBER}
• Report URL: ${reportUrl}

(Open the link to view the full HTML report with colors & charts)
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
