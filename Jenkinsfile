pipeline {
    agent any

    environment {
        KUBECONFIG = "/var/jenkins_home/.kube/config"

        IMAGE_TAG = "${BUILD_NUMBER}"

        FRONTEND_IMAGE = "arinkaushal/mes-client:${IMAGE_TAG}"
        BACKEND_IMAGE  = "arinkaushal/mes-server:${IMAGE_TAG}"
    }

    stages {

        stage('Clone Repository') {
            steps {
                git 'https://github.com/arinkaushal/manufacturing-execution-system.git'
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh 'docker build -t $FRONTEND_IMAGE ./client'
            }
        }

        stage('Build Backend Image') {
            steps {
                sh 'docker build -t $BACKEND_IMAGE ./server'
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                }
            }
        }

        stage('Push Images') {
            steps {
                sh 'docker push $FRONTEND_IMAGE'
                sh 'docker push $BACKEND_IMAGE'
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                kubectl set image deployment/frontend-deployment frontend=$FRONTEND_IMAGE
                kubectl set image deployment/backend-deployment backend=$BACKEND_IMAGE
                '''
            }
        }
    }
}