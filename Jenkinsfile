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
          // ✅ HARD GUARANTEE: fail build if report not found
          def reportFile = sh(
            script: 'ls -t report_*.html | head -n 1',
            returnStdout: true
          ).trim()

          echo "Found report: ${reportFile}"

          env.REPORT_FILE = reportFile

          archiveArtifacts artifacts: reportFile, fingerprint: true
        }
      }
    }
  }

  post {

    success {
      script {
        def reportLink = "${env.BUILD_URL}artifact/${env.REPORT_FILE}"

        slackSend(
          channel: "#all-poc-k6",
          message: """✅ *k6 POC PASSED*
• Job: ${env.JOB_NAME}
• Build: ${env.BUILD_NUMBER}
• 📊 Report: ${reportLink}

⬆️ Click the link to open the full HTML report with colors & charts.
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
