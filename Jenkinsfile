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
        def reportFile = sh(
          script: "ls -1 report_*.html 2>/dev/null | sort | tail -n 1 || true",
          returnStdout: true
        ).trim()

        if (reportFile) {
          archiveArtifacts artifacts: reportFile, fingerprint: true
          env.REPORT_FILE = reportFile
        } else {
          echo "No report found to archive"
        }
      }
    }

    success {
      script {
        def reportLink = env.REPORT_FILE
          ? "${env.BUILD_URL}artifact/${env.REPORT_FILE}"
          : "No report generated"

        slackSend(
          channel: "#all-poc-k6",
          message: """✅ *k6 POC PASSED*
• Job: ${env.JOB_NAME}
• Build: ${env.BUILD_NUMBER}
• Report: ${reportLink}
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
