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

    stage('Run k6') {
      steps {
        sh '''
          set -e
          ls -l
          k6 run Script.js
        '''
      }
    }
  }
}
