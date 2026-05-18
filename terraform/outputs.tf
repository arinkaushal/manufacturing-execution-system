output "public_ip" {
  value = aws_instance.frontend_server.public_ip
}

output "ssh_command" {
  value = "ssh -i C:/Users/ARIN/Downloads/mes-client.pem ubuntu@${aws_instance.frontend_server.public_ip}"
}