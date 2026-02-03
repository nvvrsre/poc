pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    timestamps()
  }

  environment {
    REPORT_FILE = "report_build_${BUILD_NUMBER}.html"
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
          if (!fileExists(env.REPORT_FILE)) {
            error "Report not found: ${env.REPORT_FILE}"
          }

          echo "Found report: ${env.REPORT_FILE}"
          archiveArtifacts artifacts: env.REPORT_FILE, fingerprint: true
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
• Report:
${env.BUILD_URL}artifact/${env.REPORT_FILE}
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
