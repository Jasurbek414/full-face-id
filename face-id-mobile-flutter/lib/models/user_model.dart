class UserModel {
  final String id;
  final String phone;
  final String? email;
  final String firstName;
  final String lastName;
  final String? photo;
  final bool isActive;
  final String? companyId;
  final String? companyName;
  final RoleModel? role;
  final DateTime dateJoined;

  UserModel({
    required this.id,
    required this.phone,
    this.email,
    required this.firstName,
    required this.lastName,
    this.photo,
    required this.isActive,
    this.companyId,
    this.companyName,
    this.role,
    required this.dateJoined,
  });

  String get fullName {
    final name = '$firstName $lastName'.trim();
    return name.isNotEmpty ? name : phone;
  }

  String get initials {
    if (firstName.isNotEmpty && lastName.isNotEmpty) {
      return '${firstName[0]}${lastName[0]}'.toUpperCase();
    }
    if (firstName.isNotEmpty) return firstName[0].toUpperCase();
    return phone.isNotEmpty ? phone[0] : '?';
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      phone: json['phone'] ?? '',
      email: json['email'],
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      photo: json['photo'],
      isActive: json['is_active'] ?? true,
      companyId: json['company'] is Map
          ? json['company']['id']?.toString()
          : json['company']?.toString(),
      companyName: json['company'] is Map
          ? json['company']['name']
          : json['company_name'],
      role: json['role'] != null ? RoleModel.fromJson(json['role']) : null,
      dateJoined: json['date_joined'] != null
          ? DateTime.tryParse(json['date_joined']) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'phone': phone,
    'email': email,
    'first_name': firstName,
    'last_name': lastName,
    'photo': photo,
    'is_active': isActive,
    'company': companyId,
    'role': role?.toJson(),
    'date_joined': dateJoined.toIso8601String(),
  };
}

class RoleModel {
  final String id;
  final String name;

  RoleModel({required this.id, required this.name});

  factory RoleModel.fromJson(Map<String, dynamic> json) {
    return RoleModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'name': name};
}
