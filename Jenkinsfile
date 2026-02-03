pipeline {
  agent any

  options {
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
          env.REPORT_FILE = sh(
            script: "ls -1 report_*.html | sort | tail -n 1",
            returnStdout: true
          ).trim()

          echo "Latest report detected: ${env.REPORT_FILE}"

          archiveArtifacts artifacts: env.REPORT_FILE, fingerprint: true
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
• Report: ${reportLink}

ℹ️ Open the link in a browser to view the full colored HTML report.
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
