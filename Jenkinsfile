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
          k6 run script.js
        '''
      }
    }

    stage('Collect Report') {
      steps {
        script {
          def reportFile = sh(
            script: "ls -1 report_*.html | sort | tail -n 1",
            returnStdout: true
          ).trim()

          if (!reportFile) {
            error("No k6 HTML report found in workspace")
          }

          env.REPORT_FILE = reportFile
          env.REPORT_URL  = "${env.BUILD_URL}artifact/${reportFile}"

          echo "Report file: ${env.REPORT_FILE}"
          echo "Report URL : ${env.REPORT_URL}"
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: "${REPORT_FILE}", fingerprint: true
    }

    success {
      slackSend(
        channel: "#all-poc-k6",
        message: """✅ *k6 POC PASSED*
• Job: ${env.JOB_NAME}
• Build: ${env.BUILD_NUMBER}
• Report: ${env.REPORT_URL}
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
